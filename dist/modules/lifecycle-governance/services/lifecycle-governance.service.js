"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifecycleGovernanceService = void 0;
const uuid_1 = require("uuid");
const config_1 = require("../../../config");
const car_model_1 = require("../../../models/car.model");
const lifecycle_request_model_1 = require("../../../models/lifecycle-request.model");
const user_model_1 = require("../../../models/user.model");
const otp_service_1 = require("../../../shared/services/otp.service");
const email_service_1 = require("../../../shared/services/email.service");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const audit_util_1 = require("../../../shared/utils/audit.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const car_lifecycle_service_1 = require("../../cars/services/car-lifecycle.service");
function maskEmail(email) {
    if (!email)
        return '(no email recipient configured)';
    const [local, domain] = email.split('@');
    if (!domain)
        return email;
    const visible = local.slice(0, 2);
    return `${visible}…@${domain}`;
}
function transitionKey(from, to) {
    return `${from}→${to}`;
}
function isOtpRequired(from, to) {
    return car_lifecycle_service_1.OTP_REQUIRED_TRANSITIONS.has(transitionKey(from, to));
}
function isBlocked(from, to) {
    return car_lifecycle_service_1.BLOCKED_TRANSITIONS.has(transitionKey(from, to));
}
class LifecycleGovernanceService {
    /**
     * Create a lifecycle change request.
     *
     * - Non-super-admin: creates a pending request awaiting super_admin approval.
     * - Super-admin (no OTP required): directly executes the transition, returns approved.
     * - Super-admin (OTP required): generates OTP, sends email, returns otp_pending.
     */
    static async createRequest(input, actor) {
        if (!input.acknowledged_warning) {
            throw new app_error_util_1.AppError('You must acknowledge the lifecycle change warning before proceeding.', 400);
        }
        const car = await car_model_1.Car.findOne({ car_id: input.car_id, is_deleted: false }).lean();
        if (!car)
            throw new app_error_util_1.AppError(`Car not found: ${input.car_id}`, 404);
        const fromState = (car.entity_lifecycle_state || 'launched');
        const toState = input.to_state;
        if (fromState === toState) {
            throw new app_error_util_1.AppError(`Car is already in ${toState} state.`, 400);
        }
        // Check blocked transitions — only overridable by super_admin with reason
        if (isBlocked(fromState, toState)) {
            if (actor.role !== 'super_admin') {
                throw new app_error_util_1.AppError(`Transition ${fromState}→${toState} is a historical relaunch and is blocked. Only Super Admin can override.`, 403);
            }
            if (!input.is_override) {
                throw new app_error_util_1.AppError(`Transition ${fromState}→${toState} is blocked by default. Set is_override=true with an override_reason to proceed.`, 400);
            }
            if (!input.override_reason?.trim()) {
                throw new app_error_util_1.AppError('override_reason is required for blocked transitions.', 400);
            }
        }
        else {
            // Standard transition validation
            const allowed = car_lifecycle_service_1.VALID_TRANSITIONS[fromState] ?? [];
            if (!allowed.includes(toState)) {
                throw new app_error_util_1.AppError(`Invalid transition: ${fromState}→${toState}. Allowed from ${fromState}: ${allowed.join(', ') || 'none'}`, 400);
            }
        }
        // Prevent duplicate active requests for same car
        const existingActive = await lifecycle_request_model_1.LifecycleRequest.findOne({
            car_id: input.car_id,
            status: { $in: ['pending', 'otp_pending'] },
        }).lean();
        if (existingActive) {
            throw new app_error_util_1.AppError(`A lifecycle request is already active for this car (request_id: ${existingActive.request_id}, status: ${existingActive.status}). Cancel or complete it before creating a new one.`, 409);
        }
        const requester = await user_model_1.User.findOne({ user_id: actor.user_id, is_deleted: false }).lean();
        if (!requester)
            throw app_error_util_1.AppError.unauthorized('Requesting user no longer exists');
        const isSuperAdmin = actor.role === 'super_admin';
        const otpNeeded = isOtpRequired(fromState, toState) || (input.is_override ?? false);
        const requestId = (0, uuid_1.v4)();
        // ── Non-super-admin: queue as pending ───────────────────────────────
        if (!isSuperAdmin) {
            await lifecycle_request_model_1.LifecycleRequest.create({
                request_id: requestId,
                car_id: input.car_id,
                car_name: car.name,
                car_slug: car.slug,
                model_family: car.model_family ?? null,
                from_state: fromState,
                to_state: toState,
                status: 'pending',
                reason: input.reason ?? null,
                requested_by_user_id: actor.user_id,
                requested_by_email: actor.email ?? null,
                requested_by_role: actor.role ?? null,
                otp_required: otpNeeded,
                is_override: input.is_override ?? false,
                override_reason: input.override_reason ?? null,
                is_direct: false,
            });
            await audit_util_1.AuditUtil.recordEvent({
                entity_type: 'car',
                entity_id: input.car_id,
                action: 'update',
                field: 'lifecycle_request',
                new_value: { request_id: requestId, from: fromState, to: toState, status: 'pending' },
                actor,
            });
            return { request_id: requestId, status: 'pending' };
        }
        // ── Super-admin path ────────────────────────────────────────────────
        if (!otpNeeded) {
            // Direct execution — no request queue needed
            await lifecycle_request_model_1.LifecycleRequest.create({
                request_id: requestId,
                car_id: input.car_id,
                car_name: car.name,
                car_slug: car.slug,
                model_family: car.model_family ?? null,
                from_state: fromState,
                to_state: toState,
                status: 'approved',
                reason: input.reason ?? null,
                requested_by_user_id: actor.user_id,
                requested_by_email: actor.email ?? null,
                requested_by_role: actor.role ?? null,
                otp_required: false,
                is_override: input.is_override ?? false,
                override_reason: input.override_reason ?? null,
                is_direct: true,
                approved_by_user_id: actor.user_id,
                approved_at: new Date(),
            });
            await car_lifecycle_service_1.CarLifecycleService.transitionState(input.car_id, toState, actor, input.reason);
            await audit_util_1.AuditUtil.recordEvent({
                entity_type: 'car',
                entity_id: input.car_id,
                action: 'update',
                field: 'lifecycle_state',
                old_value: fromState,
                new_value: toState,
                actor,
            });
            return { request_id: requestId, status: 'approved', transition_applied: true };
        }
        // OTP required — send OTP then wait for verify-otp
        return this._sendOtpForRequest({
            requestId,
            car,
            fromState,
            toState,
            actor,
            reason: input.reason,
            isOverride: input.is_override ?? false,
            overrideReason: input.override_reason ?? null,
            isDirect: true,
        });
    }
    /**
     * Super-admin approves a pending request.
     * - If OTP not required: executes immediately.
     * - If OTP required: sends OTP, returns otp_pending.
     */
    static async approveRequest(requestId, actor) {
        if (actor.role !== 'super_admin') {
            throw app_error_util_1.AppError.forbidden('Only Super Admin can approve lifecycle requests');
        }
        const request = await lifecycle_request_model_1.LifecycleRequest.findOne({ request_id: requestId });
        if (!request)
            throw new app_error_util_1.AppError(`Lifecycle request not found: ${requestId}`, 404);
        if (request.status !== 'pending') {
            throw new app_error_util_1.AppError(`Cannot approve — request status is ${request.status}.`, 409);
        }
        const car = await car_model_1.Car.findOne({ car_id: request.car_id, is_deleted: false }).lean();
        if (!car)
            throw new app_error_util_1.AppError(`Car ${request.car_id} no longer exists.`, 404);
        // Re-validate transition from CURRENT state (not the state at request time)
        const currentState = (car.entity_lifecycle_state || 'launched');
        if (currentState !== request.from_state) {
            throw new app_error_util_1.AppError(`Car state has changed since request was created. Expected ${request.from_state}, current is ${currentState}. Cancel this request and create a new one.`, 409);
        }
        const otpNeeded = request.otp_required;
        if (!otpNeeded) {
            request.status = 'approved';
            request.approved_by_user_id = actor.user_id;
            request.approved_at = new Date();
            await request.save();
            await car_lifecycle_service_1.CarLifecycleService.transitionState(request.car_id, request.to_state, actor, request.reason ?? undefined);
            await audit_util_1.AuditUtil.recordEvent({
                entity_type: 'car',
                entity_id: request.car_id,
                action: 'update',
                field: 'lifecycle_state',
                old_value: request.from_state,
                new_value: request.to_state,
                actor,
            });
            return { request_id: requestId, status: 'approved', transition_applied: true };
        }
        // OTP required
        return this._sendOtpForExistingRequest(request, actor);
    }
    /**
     * Verify OTP and execute the lifecycle transition.
     * Used for both direct super-admin actions and approval flow.
     */
    static async verifyOTP(requestId, otpInput, actor) {
        if (actor.role !== 'super_admin') {
            throw app_error_util_1.AppError.forbidden('Only Super Admin can verify lifecycle OTPs');
        }
        const request = await lifecycle_request_model_1.LifecycleRequest.findOne({ request_id: requestId }).select('+otp_hash');
        if (!request)
            throw new app_error_util_1.AppError(`Lifecycle request not found: ${requestId}`, 404);
        if (request.status !== 'otp_pending') {
            throw new app_error_util_1.AppError(`Request is not awaiting OTP verification (status: ${request.status}).`, 409);
        }
        if (!request.otp_expires_at || request.otp_expires_at.getTime() < Date.now()) {
            request.status = 'expired';
            await request.save();
            throw new app_error_util_1.AppError('OTP has expired. Please approve the request again to get a new code.', 410);
        }
        if (request.otp_attempts >= request.otp_max_attempts) {
            request.status = 'rejected';
            await request.save();
            throw new app_error_util_1.AppError('Maximum OTP attempts exceeded. The request has been rejected.', 429);
        }
        if (!request.otp_hash) {
            throw new app_error_util_1.AppError('OTP hash missing. Please contact support.', 500);
        }
        const valid = await otp_service_1.OtpService.verify(otpInput.trim(), request.otp_hash);
        if (!valid) {
            request.otp_attempts += 1;
            if (request.otp_attempts >= request.otp_max_attempts) {
                request.status = 'rejected';
            }
            await request.save();
            const remaining = Math.max(0, request.otp_max_attempts - request.otp_attempts);
            throw new app_error_util_1.AppError(`Incorrect OTP. ${remaining} attempt(s) remaining.`, 401);
        }
        // OTP valid — execute transition
        await car_lifecycle_service_1.CarLifecycleService.transitionState(request.car_id, request.to_state, actor, request.reason ?? undefined);
        request.status = 'approved';
        request.approved_by_user_id = actor.user_id;
        request.approved_at = new Date();
        request.otp_hash = null;
        await request.save();
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'car',
            entity_id: request.car_id,
            action: 'update',
            field: 'lifecycle_state',
            old_value: request.from_state,
            new_value: request.to_state,
            actor,
        });
        return { request_id: requestId, status: 'approved', transition_applied: true };
    }
    static async rejectRequest(requestId, rejectionReason, actor) {
        if (actor.role !== 'super_admin') {
            throw app_error_util_1.AppError.forbidden('Only Super Admin can reject lifecycle requests');
        }
        const request = await lifecycle_request_model_1.LifecycleRequest.findOne({ request_id: requestId });
        if (!request)
            throw new app_error_util_1.AppError(`Lifecycle request not found: ${requestId}`, 404);
        if (request.status !== 'pending' && request.status !== 'otp_pending') {
            throw new app_error_util_1.AppError(`Cannot reject — request status is ${request.status}.`, 409);
        }
        request.status = 'rejected';
        request.rejected_by_user_id = actor.user_id;
        request.rejected_at = new Date();
        request.rejection_reason = rejectionReason ?? null;
        await request.save();
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'car',
            entity_id: request.car_id,
            action: 'update',
            field: 'lifecycle_request',
            old_value: { request_id: requestId, status: 'pending' },
            new_value: { request_id: requestId, status: 'rejected', reason: rejectionReason ?? null },
            actor,
        });
        return request;
    }
    static async cancelRequest(requestId, reason, actor) {
        const request = await lifecycle_request_model_1.LifecycleRequest.findOne({ request_id: requestId });
        if (!request)
            throw new app_error_util_1.AppError(`Lifecycle request not found: ${requestId}`, 404);
        // Allow requester to cancel their own request, or super_admin to cancel any
        const isOwner = request.requested_by_user_id === actor.user_id;
        const isAdmin = actor.role === 'super_admin' || actor.role === 'admin';
        if (!isOwner && !isAdmin) {
            throw app_error_util_1.AppError.forbidden('You can only cancel your own lifecycle requests');
        }
        if (request.status !== 'pending' && request.status !== 'otp_pending') {
            throw new app_error_util_1.AppError(`Cannot cancel — request status is ${request.status}.`, 409);
        }
        request.status = 'cancelled';
        request.cancelled_at = new Date();
        request.cancellation_reason = reason ?? null;
        await request.save();
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'car',
            entity_id: request.car_id,
            action: 'update',
            field: 'lifecycle_request',
            old_value: { request_id: requestId, status: request.status },
            new_value: { request_id: requestId, status: 'cancelled', reason: reason ?? null },
            actor,
        });
        return request;
    }
    static async listRequests(params) {
        const { page = 1, limit = 25, status, car_id, actor } = params;
        const filter = {};
        if (status)
            filter.status = status;
        if (car_id)
            filter.car_id = car_id;
        // Non-admins see only their own requests
        if (actor.role !== 'admin' && actor.role !== 'super_admin') {
            filter.requested_by_user_id = actor.user_id;
        }
        const { skip, limit: lim } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const [requests, total] = await Promise.all([
            lifecycle_request_model_1.LifecycleRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
            lifecycle_request_model_1.LifecycleRequest.countDocuments(filter),
        ]);
        return {
            requests,
            pagination: pagination_util_1.PaginationUtil.createPaginationMeta(page, lim, total),
        };
    }
    static async getPendingForCar(carId) {
        return lifecycle_request_model_1.LifecycleRequest.findOne({
            car_id: carId,
            status: { $in: ['pending', 'otp_pending'] },
        }).lean();
    }
    // ── Internal helpers ────────────────────────────────────────────────────────
    static async _sendOtpForRequest(opts) {
        const { requestId, car, fromState, toState, actor, reason, isOverride, overrideReason, isDirect } = opts;
        const recipient = config_1.config.lifecycle_governance.otp_email_recipient;
        const otp = otp_service_1.OtpService.generate(6);
        const otpHash = await otp_service_1.OtpService.hash(otp);
        const expiresAt = new Date(Date.now() + config_1.config.lifecycle_governance.otp_ttl_seconds * 1000);
        let sendResult;
        try {
            sendResult = await email_service_1.EmailService.sendLifecycleOtp(recipient, otp, {
                request_id: requestId,
                from_state: fromState,
                to_state: toState,
                entity_label: `${car.name} (${car.slug})`,
                reason: reason,
                is_override: isOverride,
            });
        }
        catch (err) {
            throw new app_error_util_1.AppError(`Failed to send lifecycle approval OTP: ${err?.message ?? 'unknown error'}`, 502, { userMessage: 'Could not send the approval code. Check SMTP credentials.' });
        }
        await lifecycle_request_model_1.LifecycleRequest.create({
            request_id: requestId,
            car_id: car.car_id,
            car_name: car.name,
            car_slug: car.slug,
            model_family: car.model_family ?? null,
            from_state: fromState,
            to_state: toState,
            status: 'otp_pending',
            reason: reason ?? null,
            requested_by_user_id: actor.user_id,
            requested_by_email: actor.email ?? null,
            requested_by_role: actor.role ?? null,
            otp_required: true,
            otp_hash: otpHash,
            otp_expires_at: expiresAt,
            otp_attempts: 0,
            otp_max_attempts: config_1.config.lifecycle_governance.otp_max_attempts,
            otp_channel: sendResult.channel,
            otp_sent_to: sendResult.channel === 'email' ? recipient : 'console',
            is_override: isOverride,
            override_reason: overrideReason,
            is_direct: isDirect,
        });
        return {
            request_id: requestId,
            status: 'otp_pending',
            otp_sent_to_masked: sendResult.channel === 'email'
                ? maskEmail(recipient)
                : 'server console (dev fallback)',
        };
    }
    static async _sendOtpForExistingRequest(request, actor) {
        const recipient = config_1.config.lifecycle_governance.otp_email_recipient;
        const otp = otp_service_1.OtpService.generate(6);
        const otpHash = await otp_service_1.OtpService.hash(otp);
        const expiresAt = new Date(Date.now() + config_1.config.lifecycle_governance.otp_ttl_seconds * 1000);
        let sendResult;
        try {
            sendResult = await email_service_1.EmailService.sendLifecycleOtp(recipient, otp, {
                request_id: request.request_id,
                from_state: request.from_state,
                to_state: request.to_state,
                entity_label: `${request.car_name} (${request.car_slug})`,
                reason: request.reason ?? undefined,
                is_override: request.is_override,
            });
        }
        catch (err) {
            throw new app_error_util_1.AppError(`Failed to send lifecycle approval OTP: ${err?.message ?? 'unknown error'}`, 502);
        }
        // Update request to otp_pending with fresh OTP
        request.status = 'otp_pending';
        request.otp_hash = otpHash;
        request.otp_expires_at = expiresAt;
        request.otp_attempts = 0;
        request.otp_channel = sendResult.channel;
        request.otp_sent_to = sendResult.channel === 'email' ? recipient : 'console';
        await request.save();
        return {
            request_id: request.request_id,
            status: 'otp_pending',
            otp_sent_to_masked: sendResult.channel === 'email'
                ? maskEmail(recipient)
                : 'server console (dev fallback)',
        };
    }
}
exports.LifecycleGovernanceService = LifecycleGovernanceService;
