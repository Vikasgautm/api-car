"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const audit_util_1 = require("../../../shared/utils/audit.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const audit_service_1 = require("../services/audit.service");
const ENTITY_TYPES = ['car', 'variant', 'tag', 'tag_category', 'benchmark_override'];
function parseEntityType(input) {
    if (input == null || input === '')
        return undefined;
    if (typeof input !== 'string')
        return undefined;
    return ENTITY_TYPES.includes(input) ? input : undefined;
}
class AuditController {
    static list = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { entity_type, entity_id, actor_user_id, action, since, page, limit, hydrate_users } = req.query;
        const result = await audit_service_1.AuditService.list({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            entity_type: parseEntityType(entity_type),
            entity_id: entity_id ? String(entity_id) : undefined,
            actor_user_id: actor_user_id ? String(actor_user_id) : undefined,
            action: action ? String(action) : undefined,
            since: since ? String(since) : undefined,
        });
        let users = {};
        if (hydrate_users === 'true' || hydrate_users === '1') {
            const userIds = result.logs.map(l => l.actor_user_id).filter((id) => !!id);
            users = await audit_service_1.AuditService.hydrateUserNames(userIds);
        }
        return response_util_1.ResponseUtil.paginated(res, result.logs.map(l => ({
            ...l,
            actor_name: l.actor_user_id ? users[l.actor_user_id]?.user_name ?? null : null,
        })), result.pagination, 'Audit logs retrieved successfully');
    });
    static recent = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const limit = req.query.limit ? Number(req.query.limit) : 50;
        const result = await audit_service_1.AuditService.list({ page: 1, limit });
        const userIds = result.logs.map(l => l.actor_user_id).filter((id) => !!id);
        const users = await audit_service_1.AuditService.hydrateUserNames(userIds);
        return response_util_1.ResponseUtil.paginated(res, result.logs.map(l => ({
            ...l,
            actor_name: l.actor_user_id ? users[l.actor_user_id]?.user_name ?? null : null,
        })), result.pagination, 'Recent audit activity');
    });
    static stale = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const days = Number(req.query.days ?? 60);
        const limit = Number(req.query.limit ?? 25);
        const result = await audit_service_1.AuditService.getStaleContent(Number.isFinite(days) && days > 0 ? days : 60, limit);
        return response_util_1.ResponseUtil.success(res, result, 'Stale content retrieved');
    });
    static markReviewed = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const entityType = req.params.entity_type;
        if (entityType !== 'car' && entityType !== 'variant') {
            throw new app_error_util_1.AppError(`entity_type must be 'car' or 'variant' (got: ${entityType})`, 400);
        }
        const updated = await audit_service_1.AuditService.markReviewed(entityType, req.params.entity_id, audit_util_1.AuditUtil.actorFromRequest(req));
        return response_util_1.ResponseUtil.success(res, updated, 'Marked as reviewed');
    });
}
exports.AuditController = AuditController;
//# sourceMappingURL=audit.controller.js.map