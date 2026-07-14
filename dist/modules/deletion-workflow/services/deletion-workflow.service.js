"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeletionWorkflowService = void 0;
const uuid_1 = require("uuid");
const config_1 = require("../../../config");
const car_model_1 = require("../../../models/car.model");
const deletion_request_model_1 = require("../../../models/deletion-request.model");
const user_model_1 = require("../../../models/user.model");
const otp_service_1 = require("../../../shared/services/otp.service");
const email_service_1 = require("../../../shared/services/email.service");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const audit_util_1 = require("../../../shared/utils/audit.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
function maskEmail(email) {
    if (!email)
        return '(no email recipient configured)';
    const [local, domain] = email.split('@');
    if (!domain)
        return email;
    const visible = local.slice(0, 2);
    return `${visible}…@${domain}`;
}
class DeletionWorkflowService {
    /**
     * Create a deletion request. Generates an OTP, persists its hash, sends the
     * code via email (or dev-console fallback), and writes an audit row. The OTP
     * itself is never returned.
     */
    static async create(input, actor) {
        if (input.entity_type !== 'car') {
            throw new app_error_util_1.AppError(`Unsupported entity_type: ${input.entity_type}`, 400);
        }
        // Hard-delete is super-admin only.
        if (input.action === 'hard_delete' && actor.role !== 'super_admin') {
            throw app_error_util_1.AppError.forbidden('hard_delete requires super_admin', 'Only super admins can request a permanent delete.');
        }
        // The target must exist and not already be soft-deleted.
        const car = await car_model_1.Car.findOne({ car_id: input.entity_id, is_deleted: false }).lean();
        if (!car) {
            throw app_error_util_1.AppError.carNotFound(input.entity_id);
        }
        // Prevent a duplicate pending request for the same (entity, action).
        const existing = await deletion_request_model_1.DeletionRequest.findOne({
            entity_type: 'car',
            entity_id: input.entity_id,
            action: input.action,
            status: 'pending',
            otp_expires_at: { $gt: new Date() },
        });
        if (existing) {
            throw new app_error_util_1.AppError(`A pending ${input.action} request already exists for this car (request_id: ${existing.request_id}). Cancel or verify it before opening a new one.`, 409);
        }
        // Verify the requester is a real user — we don't need their phone any more
        // (email OTP goes to the centralised approval inbox), but we still want a
        // 401 if the actor's user record was deleted between login and now.
        const requester = await user_model_1.User.findOne({ user_id: actor.user_id, is_deleted: false }).lean();
        if (!requester) {
            throw app_error_util_1.AppError.unauthorized('Requesting user no longer exists');
        }
        const emailRecipient = config_1.config.deletion_workflow.otp_email_recipient;
        if (!emailRecipient) {
            throw new app_error_util_1.AppError('No deletion OTP recipient configured (DELETION_OTP_EMAIL). Cannot send approval code.', 500);
        }
        const otp = otp_service_1.OtpService.generate(6);
        const otpHash = await otp_service_1.OtpService.hash(otp);
        const expiresAt = new Date(Date.now() + config_1.config.deletion_workflow.otp_ttl_seconds * 1000);
        const request_id = (0, uuid_1.v4)();
        // Send first so we don't persist a request the OTP never escaped.
        let sendResult;
        try {
            sendResult = await email_service_1.EmailService.sendOtp(emailRecipient, otp, {
                request_id,
                reason: input.reason,
                action: input.action,
                entity_label: `${car.name} (${car.slug})`,
            });
        }
        catch (err) {
            throw new app_error_util_1.AppError(`Failed to send approval email: ${err?.message ?? 'unknown error'}`, 502, { userMessage: 'Could not send the approval code. Check SMTP credentials.' });
        }
        const created = (await deletion_request_model_1.DeletionRequest.create({
            request_id,
            entity_type: 'car',
            entity_id: input.entity_id,
            action: input.action,
            reason: input.reason || null,
            redirect_to_slug: input.redirect_to_slug || null,
            requested_by_user_id: actor.user_id,
            requested_by_email: actor.email || null,
            requested_by_role: actor.role || null,
            otp_hash: otpHash,
            otp_expires_at: expiresAt,
            otp_attempts: 0,
            otp_max_attempts: config_1.config.deletion_workflow.otp_max_attempts,
            otp_channel: sendResult.channel,
            otp_sent_to: sendResult.channel === 'email' ? emailRecipient : 'console',
            status: 'pending',
        }));
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'car',
            entity_id: input.entity_id,
            action: 'update',
            field: 'deletion_request',
            new_value: {
                request_id: created.request_id,
                action: input.action,
                channel: sendResult.channel,
                reason: input.reason || null,
            },
            actor,
        });
        return {
            request_id: created.request_id,
            channel: sendResult.channel === 'email' ? 'email' : 'console',
            sent_to_masked: sendResult.channel === 'email' ? maskEmail(emailRecipient) : 'server console (dev fallback)',
            expires_at: expiresAt,
            fallback_used: sendResult.fallback_used,
        };
    }
    /**
     * Verify the OTP for a pending request. On success, apply the action and mark
     * the request approved. Increments attempts and locks out after `otp_max_attempts`.
     */
    static async verify(requestId, otpInput, actor) {
        const request = await deletion_request_model_1.DeletionRequest.findOne({ request_id: requestId }).select('+otp_hash');
        if (!request)
            throw app_error_util_1.AppError.notFound('Deletion request', 'request_id', requestId);
        if (request.status !== 'pending') {
            throw new app_error_util_1.AppError(`This request is already ${request.status} and can no longer be verified.`, 409);
        }
        if (request.otp_expires_at.getTime() < Date.now()) {
            request.status = 'expired';
            await request.save();
            throw new app_error_util_1.AppError('OTP has expired. Please open a new request.', 410);
        }
        if (request.otp_attempts >= request.otp_max_attempts) {
            request.status = 'rejected';
            await request.save();
            throw new app_error_util_1.AppError('Maximum OTP attempts exceeded. Open a new request.', 429);
        }
        const ok = await otp_service_1.OtpService.verify(otpInput.trim(), request.otp_hash);
        if (!ok) {
            request.otp_attempts += 1;
            // Lock the request after the last attempt so the OTP can't be reused.
            if (request.otp_attempts >= request.otp_max_attempts) {
                request.status = 'rejected';
            }
            await request.save();
            const remaining = Math.max(0, request.otp_max_attempts - request.otp_attempts);
            throw new app_error_util_1.AppError(`Incorrect OTP. ${remaining} attempt(s) remaining.`, 401);
        }
        // Apply the action.
        const applied = await this.applyAction(request, actor);
        request.status = 'approved';
        request.approved_by_user_id = actor.user_id;
        request.approved_at = new Date();
        await request.save();
        return { request, applied };
    }
    /**
     * Cancel a pending request without touching the entity.
     */
    static async cancel(requestId, reason, actor) {
        const request = await deletion_request_model_1.DeletionRequest.findOne({ request_id: requestId });
        if (!request)
            throw app_error_util_1.AppError.notFound('Deletion request', 'request_id', requestId);
        if (request.status !== 'pending') {
            throw new app_error_util_1.AppError(`Cannot cancel — request status is ${request.status}.`, 409);
        }
        request.status = 'cancelled';
        request.cancelled_at = new Date();
        request.cancellation_reason = reason || null;
        await request.save();
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'car',
            entity_id: request.entity_id,
            action: 'update',
            field: 'deletion_request',
            old_value: { request_id: request.request_id, status: 'pending' },
            new_value: { request_id: request.request_id, status: 'cancelled', reason: reason || null },
            actor,
        });
        return request;
    }
    /** List requests (admins see all; non-admins see only their own). */
    static async list(params) {
        const { page = 1, limit = 25, status, entity_id, actor } = params;
        const filter = {};
        if (status)
            filter.status = status;
        if (entity_id)
            filter.entity_id = entity_id;
        if (actor.role !== 'admin' && actor.role !== 'super_admin') {
            filter.requested_by_user_id = actor.user_id;
        }
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const [requests, total] = await Promise.all([
            deletion_request_model_1.DeletionRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(validatedLimit).lean(),
            deletion_request_model_1.DeletionRequest.countDocuments(filter),
        ]);
        return {
            requests,
            pagination: pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total),
        };
    }
    /**
     * Apply the requested status transition on the Car. Audit rows are written by
     * the lifecycle helpers + a single 'archive'/'disable'/'discontinue'/'delete'
     * event from here.
     */
    static async applyAction(request, actor) {
        const carId = request.entity_id;
        const now = new Date();
        if (request.action === 'hard_delete') {
            const before = await car_model_1.Car.findOne({ car_id: carId }).lean();
            if (!before)
                throw app_error_util_1.AppError.carNotFound(carId);
            await car_model_1.Car.deleteOne({ car_id: carId });
            await audit_util_1.AuditUtil.recordEvent({
                entity_type: 'car',
                entity_id: carId,
                action: 'delete',
                field: 'car_id',
                old_value: carId,
                new_value: null,
                actor,
            });
            return before;
        }
        const update = {};
        let auditAction = 'archive';
        let fieldName = 'status';
        let newStatus;
        if (request.action === 'archive') {
            update.status = 'archived';
            update.archived_at = now;
            update.archived_by = actor.user_id;
            newStatus = 'archived';
            auditAction = 'archive';
        }
        else if (request.action === 'disable') {
            update.status = 'disabled';
            update.disabled_at = now;
            update.disabled_by = actor.user_id;
            newStatus = 'disabled';
            auditAction = 'update';
        }
        else {
            // discontinue
            update.status = 'discontinued';
            update.discontinued_at = now;
            update.discontinued_by = actor.user_id;
            newStatus = 'discontinued';
            auditAction = 'update';
        }
        if (request.redirect_to_slug) {
            update.redirect_to_slug = request.redirect_to_slug;
        }
        const before = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false }).lean();
        if (!before)
            throw app_error_util_1.AppError.carNotFound(carId);
        const updated = await car_model_1.Car.findOneAndUpdate({ car_id: carId, is_deleted: false }, update, { returnDocument: 'after' });
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'car',
            entity_id: carId,
            action: auditAction,
            field: fieldName,
            old_value: before.status,
            new_value: newStatus,
            actor,
        });
        return updated;
    }
}
exports.DeletionWorkflowService = DeletionWorkflowService;
