"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const audit_log_model_1 = require("../../../models/audit-log.model");
const car_model_1 = require("../../../models/car.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
const user_model_1 = require("../../../models/user.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const audit_util_1 = require("../../../shared/utils/audit.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
class AuditService {
    static async list(params) {
        const { page = 1, limit = 25, entity_type, entity_id, actor_user_id, action, since } = params;
        const filter = {};
        if (entity_type)
            filter.entity_type = entity_type;
        if (entity_id)
            filter.entity_id = entity_id;
        if (actor_user_id)
            filter.actor_user_id = actor_user_id;
        if (action)
            filter.action = action;
        if (since) {
            const sinceDate = new Date(since);
            if (!Number.isNaN(sinceDate.getTime())) {
                filter.timestamp = { $gte: sinceDate };
            }
        }
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const [logs, total] = await Promise.all([
            audit_log_model_1.AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(validatedLimit).lean(),
            audit_log_model_1.AuditLog.countDocuments(filter),
        ]);
        return {
            logs,
            pagination: pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total),
        };
    }
    /**
     * Cars / variants whose last_reviewed_at is older than `staleAfterDays`
     * (or has never been reviewed). Returns lean docs limited for display.
     */
    static async getStaleContent(staleAfterDays, limit = 25) {
        const cutoff = new Date(Date.now() - staleAfterDays * 24 * 60 * 60 * 1000);
        const filter = {
            is_deleted: false,
            $or: [
                { last_reviewed_at: null },
                { last_reviewed_at: { $lt: cutoff } },
            ],
        };
        const [cars, variants] = await Promise.all([
            car_model_1.Car.find(filter)
                .select('car_id name slug last_reviewed_at reviewer_user_id editor_user_id seo_owner_user_id')
                .sort({ last_reviewed_at: 1 })
                .limit(limit)
                .lean(),
            car_variant_model_1.CarVariant.find({ ...filter, is_archived: false })
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
    static async markReviewed(entityType, entityId, actor) {
        const now = new Date();
        const reviewerUserId = actor?.user_id ?? null;
        if (entityType === 'car') {
            const before = await car_model_1.Car.findOne({ car_id: entityId, is_deleted: false }).lean();
            if (!before)
                throw new app_error_util_1.AppError(`Car not found: ${entityId}`, 404);
            const updated = await car_model_1.Car.findOneAndUpdate({ car_id: entityId, is_deleted: false }, { reviewer_user_id: reviewerUserId, last_reviewed_at: now }, { returnDocument: 'after' });
            await audit_util_1.AuditUtil.recordEvent({
                entity_type: 'car',
                entity_id: entityId,
                action: 'mark_reviewed',
                old_value: before.last_reviewed_at ?? null,
                new_value: now,
                actor,
            });
            return updated;
        }
        const beforeVariant = await car_variant_model_1.CarVariant.findOne({ variant_id: entityId, is_deleted: false }).lean();
        if (!beforeVariant)
            throw new app_error_util_1.AppError(`Variant not found: ${entityId}`, 404);
        const updated = await car_variant_model_1.CarVariant.findOneAndUpdate({ variant_id: entityId, is_deleted: false }, { reviewer_user_id: reviewerUserId, last_reviewed_at: now }, { returnDocument: 'after' });
        await audit_util_1.AuditUtil.recordEvent({
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
    static async hydrateUserNames(userIds) {
        if (userIds.length === 0)
            return {};
        const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
        const users = await user_model_1.User.find({ user_id: { $in: uniqueIds } }).select('user_id user_name email').lean();
        return users.reduce((acc, u) => {
            acc[u.user_id] = { user_name: u.user_name, email: u.email };
            return acc;
        }, {});
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=audit.service.js.map