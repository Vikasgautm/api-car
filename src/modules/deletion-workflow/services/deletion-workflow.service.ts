import { v4 as uuidv4 } from 'uuid';
import { config } from '../../../config';
import { Car } from '../../../models/car.model';
import {
  DeletionAction,
  DeletionRequest,
  IDeletionRequest,
} from '../../../models/deletion-request.model';
import { User } from '../../../models/user.model';
import { OtpService } from '../../../shared/services/otp.service';
import { WhatsAppService } from '../../../shared/services/whatsapp.service';
import { AppError } from '../../../shared/utils/app-error.util';
import { AuditActor, AuditUtil } from '../../../shared/utils/audit.util';
import { PaginationUtil } from '../../../shared/utils/pagination.util';

export interface CreateRequestInput {
  entity_type: 'car';
  entity_id: string;
  action: DeletionAction;
  reason?: string;
  redirect_to_slug?: string;
}

export interface CreateRequestResult {
  request_id: string;
  channel: 'whatsapp' | 'console';
  sent_to_masked: string;
  expires_at: Date;
  fallback_used: boolean;
}

function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '(no phone on file)';
  const trimmed = phone.replace(/\s+/g, '');
  if (trimmed.length <= 4) return trimmed;
  return `${trimmed.slice(0, 3)}…${trimmed.slice(-2)}`;
}

export class DeletionWorkflowService {
  /**
   * Create a deletion request. Generates an OTP, persists its hash, sends the code
   * via WhatsApp (or dev-console fallback), and writes an audit row. The OTP itself
   * is never returned.
   */
  static async create(
    input: CreateRequestInput,
    actor: AuditActor & { user_id: string }
  ): Promise<CreateRequestResult> {
    if (input.entity_type !== 'car') {
      throw new AppError(`Unsupported entity_type: ${input.entity_type}`, 400);
    }

    // Hard-delete is super-admin only.
    if (input.action === 'hard_delete' && actor.role !== 'super_admin') {
      throw AppError.forbidden(
        'hard_delete requires super_admin',
        'Only super admins can request a permanent delete.'
      );
    }

    // The target must exist and not already be soft-deleted.
    const car = await Car.findOne({ car_id: input.entity_id, is_deleted: false }).lean();
    if (!car) {
      throw AppError.carNotFound(input.entity_id);
    }

    // Prevent a duplicate pending request for the same (entity, action).
    const existing = await DeletionRequest.findOne({
      entity_type: 'car',
      entity_id: input.entity_id,
      action: input.action,
      status: 'pending',
      otp_expires_at: { $gt: new Date() },
    });
    if (existing) {
      throw new AppError(
        `A pending ${input.action} request already exists for this car (request_id: ${existing.request_id}). Cancel or verify it before opening a new one.`,
        409
      );
    }

    // Look up the actor to find a destination phone for the OTP.
    const requester = await User.findOne({ user_id: actor.user_id, is_deleted: false }).lean();
    if (!requester) {
      throw AppError.unauthorized('Requesting user no longer exists');
    }
    const phoneTarget = requester.whatsapp_phone || requester.phone || '';

    const otp = OtpService.generate(6);
    const otpHash = await OtpService.hash(otp);
    const expiresAt = new Date(Date.now() + config.deletion_workflow.otp_ttl_seconds * 1000);

    const request_id = uuidv4();

    // Send first so we don't persist a request the OTP never escaped.
    let sendResult;
    try {
      sendResult = await WhatsAppService.sendOtp(phoneTarget, otp, {
        request_id,
        reason: input.reason,
      });
    } catch (err: any) {
      throw new AppError(
        `Failed to send WhatsApp OTP: ${err?.message ?? 'unknown error'}`,
        502,
        { userMessage: 'Could not send the approval code. Check WhatsApp credentials or admin phone on file.' }
      );
    }

    const created = (await DeletionRequest.create({
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
      otp_max_attempts: config.deletion_workflow.otp_max_attempts,
      otp_channel: sendResult.channel,
      otp_sent_to: sendResult.channel === 'whatsapp' ? phoneTarget : 'console',
      status: 'pending',
    })) as IDeletionRequest;

    await AuditUtil.recordEvent({
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
      channel: sendResult.channel,
      sent_to_masked:
        sendResult.channel === 'whatsapp' ? maskPhone(phoneTarget) : 'server console (dev fallback)',
      expires_at: expiresAt,
      fallback_used: sendResult.fallback_used,
    };
  }

  /**
   * Verify the OTP for a pending request. On success, apply the action and mark
   * the request approved. Increments attempts and locks out after `otp_max_attempts`.
   */
  static async verify(requestId: string, otpInput: string, actor: AuditActor & { user_id: string }) {
    const request = await DeletionRequest.findOne({ request_id: requestId }).select('+otp_hash');
    if (!request) throw AppError.notFound('Deletion request', 'request_id', requestId);

    if (request.status !== 'pending') {
      throw new AppError(`This request is already ${request.status} and can no longer be verified.`, 409);
    }

    if (request.otp_expires_at.getTime() < Date.now()) {
      request.status = 'expired';
      await request.save();
      throw new AppError('OTP has expired. Please open a new request.', 410);
    }

    if (request.otp_attempts >= request.otp_max_attempts) {
      request.status = 'rejected';
      await request.save();
      throw new AppError('Maximum OTP attempts exceeded. Open a new request.', 429);
    }

    const ok = await OtpService.verify(otpInput.trim(), request.otp_hash);
    if (!ok) {
      request.otp_attempts += 1;
      // Lock the request after the last attempt so the OTP can't be reused.
      if (request.otp_attempts >= request.otp_max_attempts) {
        request.status = 'rejected';
      }
      await request.save();
      const remaining = Math.max(0, request.otp_max_attempts - request.otp_attempts);
      throw new AppError(`Incorrect OTP. ${remaining} attempt(s) remaining.`, 401);
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
  static async cancel(requestId: string, reason: string | undefined, actor: AuditActor & { user_id: string }) {
    const request = await DeletionRequest.findOne({ request_id: requestId });
    if (!request) throw AppError.notFound('Deletion request', 'request_id', requestId);
    if (request.status !== 'pending') {
      throw new AppError(`Cannot cancel — request status is ${request.status}.`, 409);
    }

    request.status = 'cancelled';
    request.cancelled_at = new Date();
    request.cancellation_reason = reason || null;
    await request.save();

    await AuditUtil.recordEvent({
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
  static async list(params: {
    page?: number;
    limit?: number;
    status?: IDeletionRequest['status'];
    entity_id?: string;
    actor: AuditActor & { user_id: string };
  }) {
    const { page = 1, limit = 25, status, entity_id, actor } = params;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (entity_id) filter.entity_id = entity_id;
    if (actor.role !== 'admin' && actor.role !== 'super_admin') {
      filter.requested_by_user_id = actor.user_id;
    }

    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);

    const [requests, total] = await Promise.all([
      DeletionRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(validatedLimit).lean(),
      DeletionRequest.countDocuments(filter),
    ]);

    return {
      requests,
      pagination: PaginationUtil.createPaginationMeta(page, validatedLimit, total),
    };
  }

  /**
   * Apply the requested status transition on the Car. Audit rows are written by
   * the lifecycle helpers + a single 'archive'/'disable'/'discontinue'/'delete'
   * event from here.
   */
  private static async applyAction(request: IDeletionRequest, actor: AuditActor & { user_id: string }) {
    const carId = request.entity_id;
    const now = new Date();

    if (request.action === 'hard_delete') {
      const before = await Car.findOne({ car_id: carId }).lean();
      if (!before) throw AppError.carNotFound(carId);
      const updated = await Car.findOneAndUpdate(
        { car_id: carId },
        { is_deleted: true },
        { returnDocument: 'after' }
      );
      await AuditUtil.recordEvent({
        entity_type: 'car',
        entity_id: carId,
        action: 'delete',
        field: 'is_deleted',
        old_value: false,
        new_value: true,
        actor,
      });
      return updated;
    }

    const update: Record<string, unknown> = {};
    let auditAction: 'archive' | 'unarchive' | 'update' = 'archive';
    let fieldName = 'status';
    let newStatus: string;

    if (request.action === 'archive') {
      update.status = 'archived';
      update.archived_at = now;
      update.archived_by = actor.user_id;
      newStatus = 'archived';
      auditAction = 'archive';
    } else if (request.action === 'disable') {
      update.status = 'disabled';
      update.disabled_at = now;
      update.disabled_by = actor.user_id;
      newStatus = 'disabled';
      auditAction = 'update';
    } else {
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

    const before = await Car.findOne({ car_id: carId, is_deleted: false }).lean();
    if (!before) throw AppError.carNotFound(carId);

    const updated = await Car.findOneAndUpdate(
      { car_id: carId, is_deleted: false },
      update,
      { returnDocument: 'after' }
    );

    await AuditUtil.recordEvent({
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
