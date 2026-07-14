"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const audit_util_1 = require("../../../shared/utils/audit.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const audit_service_1 = require("../services/audit.service");
const audit_operations_service_1 = require("../services/audit-operations.service");
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
    // ── Operations Center ───────────────────────────────────────────────────────
    // GET /audit/admin/activity — grouped activity timeline (Tabs 1 & 2)
    static activity = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { entity_type, entity_id, action, actor_user_id, from, to, page, limit } = req.query;
        const result = await audit_operations_service_1.AuditOperationsService.getActivity({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            entity_type: entity_type ? String(entity_type) : undefined,
            entity_id: entity_id ? String(entity_id) : undefined,
            action: action ? String(action) : undefined,
            actor_user_id: actor_user_id ? String(actor_user_id) : undefined,
            from: from ? String(from) : undefined,
            to: to ? String(to) : undefined,
        });
        return response_util_1.ResponseUtil.paginated(res, result.events, result.pagination, 'Activity timeline retrieved');
    });
    // GET /audit/admin/imports — import monitoring (Tab 3)
    static imports = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { status, import_type, source, page, limit } = req.query;
        const result = await audit_operations_service_1.AuditOperationsService.getImports({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            status: status ? String(status) : undefined,
            import_type: import_type ? String(import_type) : undefined,
            source: source ? String(source) : undefined,
        });
        return response_util_1.ResponseUtil.success(res, result, 'Import monitoring data retrieved');
    });
    // GET /audit/admin/imports/:import_id — import detail drawer (Tab 3)
    static importDetail = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const detail = await audit_operations_service_1.AuditOperationsService.getImportDetail(String(req.params.import_id));
        if (!detail)
            return response_util_1.ResponseUtil.notFound(res, 'Import log not found');
        return response_util_1.ResponseUtil.success(res, detail, 'Import detail retrieved');
    });
    // GET /audit/admin/alerts — system alerts, generated on demand (Tab 4)
    static alerts = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const result = await audit_operations_service_1.AuditOperationsService.getAlerts();
        return response_util_1.ResponseUtil.success(res, result, 'System alerts generated');
    });
    // GET /audit/admin/entity/search?q= — entity history search (Tab 6)
    static entitySearch = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const q = String(req.query.q ?? '').trim();
        if (q.length < 2)
            return response_util_1.ResponseUtil.success(res, [], 'Query too short');
        const results = await audit_operations_service_1.AuditOperationsService.searchEntities(q);
        return response_util_1.ResponseUtil.success(res, results, 'Entity search results retrieved');
    });
    // GET /audit/admin/entity/:entity_type/:entity_id/history — full entity timeline (Tab 6)
    static entityHistory = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await audit_operations_service_1.AuditOperationsService.getEntityHistory(String(req.params.entity_type), String(req.params.entity_id));
        return response_util_1.ResponseUtil.success(res, result, 'Entity history retrieved');
    });
}
exports.AuditController = AuditController;
