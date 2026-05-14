import { AuditEntityType, AuditLog } from '../../../models/audit-log.model';
import { Car } from '../../../models/car.model';
import { CarVariant } from '../../../models/car-variant.model';
import { User } from '../../../models/user.model';
import { AppError } from '../../../shared/utils/app-error.util';
import { AuditActor, AuditUtil } from '../../../shared/utils/audit.util';
import { PaginationUtil } from '../../../shared/utils/pagination.util';

export interface AuditListParams {
  page?: number;
  limit?: number;
  entity_type?: AuditEntityType;
  entity_id?: string;
  actor_user_id?: string;
  action?: string;
  since?: string;
}

export class AuditService {
  static async list(params: AuditListParams) {
    const { page = 1, limit = 25, entity_type, entity_id, actor_user_id, action, since } = params;

    const filter: Record<string, unknown> = {};
    if (entity_type) filter.entity_type = entity_type;
    if (entity_id) filter.entity_id = entity_id;
    if (actor_user_id) filter.actor_user_id = actor_user_id;
    if (action) filter.action = action;
    if (since) {
      const sinceDate = new Date(since);
      if (!Number.isNaN(sinceDate.getTime())) {
        filter.timestamp = { $gte: sinceDate };
      }
    }

    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(validatedLimit).lean(),
      AuditLog.countDocuments(filter),
    ]);

    return {
      logs,
      pagination: PaginationUtil.createPaginationMeta(page, validatedLimit, total),
    };
  }

  /**
   * Cars / variants whose last_reviewed_at is older than `staleAfterDays`
   * (or has never been reviewed). Returns lean docs limited for display.
   */
  static async getStaleContent(staleAfterDays: number, limit = 25) {
    const cutoff = new Date(Date.now() - staleAfterDays * 24 * 60 * 60 * 1000);
    const filter = {
      is_deleted: false,
      $or: [
        { last_reviewed_at: null },
        { last_reviewed_at: { $lt: cutoff } },
      ],
    };

    const [cars, variants] = await Promise.all([
      Car.find(filter)
        .select('car_id name slug last_reviewed_at reviewer_user_id editor_user_id seo_owner_user_id')
        .sort({ last_reviewed_at: 1 })
        .limit(limit)
        .lean(),
      CarVariant.find({ ...filter, is_archived: false })
        .select('variant_id car_id variant_name last_reviewed_at reviewer_user_id editor_user_id seo_owner_user_id')
        .sort({ last_reviewed_at: 1 })
        .limit(limit)
        .lean(),
    ]);

    return { cars, variants, stale_after_days: staleAfterDays };
  }

  /**
   * Mark a car or variant as reviewed by the actor. Writes a 'mark_reviewed'
   * audit event so the timeline shows who signed off.
   */
  static async markReviewed(
    entityType: 'car' | 'variant',
    entityId: string,
    actor: AuditActor | null
  ) {
    const now = new Date();
    const reviewerUserId = actor?.user_id ?? null;

    if (entityType === 'car') {
      const before = await Car.findOne({ car_id: entityId, is_deleted: false }).lean();
      if (!before) throw new AppError(`Car not found: ${entityId}`, 404);
      const updated = await Car.findOneAndUpdate(
        { car_id: entityId, is_deleted: false },
        { reviewer_user_id: reviewerUserId, last_reviewed_at: now },
        { returnDocument: 'after' }
      );
      await AuditUtil.recordEvent({
        entity_type: 'car',
        entity_id: entityId,
        action: 'mark_reviewed',
        old_value: before.last_reviewed_at ?? null,
        new_value: now,
        actor,
      });
      return updated;
    }

    const beforeVariant = await CarVariant.findOne({ variant_id: entityId, is_deleted: false }).lean();
    if (!beforeVariant) throw new AppError(`Variant not found: ${entityId}`, 404);
    const updated = await CarVariant.findOneAndUpdate(
      { variant_id: entityId, is_deleted: false },
      { reviewer_user_id: reviewerUserId, last_reviewed_at: now },
      { returnDocument: 'after' }
    );
    await AuditUtil.recordEvent({
      entity_type: 'variant',
      entity_id: entityId,
      action: 'mark_reviewed',
      old_value: beforeVariant.last_reviewed_at ?? null,
      new_value: now,
      actor,
    });
    return updated;
  }

  /**
   * Resolve a set of user_id values to a `{ user_id -> { user_name, email } }` map.
   * Used to hydrate display names in audit log responses without N queries.
   */
  static async hydrateUserNames(userIds: string[]): Promise<Record<string, { user_name: string; email: string }>> {
    if (userIds.length === 0) return {};
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
    const users = await User.find({ user_id: { $in: uniqueIds } }).select('user_id user_name email').lean();
    return users.reduce<Record<string, { user_name: string; email: string }>>((acc, u) => {
      acc[u.user_id] = { user_name: u.user_name, email: u.email };
      return acc;
    }, {});
  }
}
