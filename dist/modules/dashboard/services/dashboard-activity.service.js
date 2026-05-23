"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardActivityService = void 0;
const audit_log_model_1 = require("../../../models/audit-log.model");
const ACTION_LABELS = {
    create: 'created',
    update: 'updated',
    delete: 'deleted',
    restore: 'restored',
    archive: 'archived',
    unarchive: 'unarchived',
    publish: 'published',
    unpublish: 'unpublished',
    mark_launched: 'launched',
    mark_upcoming: 'marked upcoming',
    mark_reviewed: 'reviewed',
};
const ENTITY_LABELS = {
    car: 'Car',
    variant: 'Variant',
    tag: 'Tag',
    tag_category: 'Tag Category',
    benchmark_override: 'Benchmark Override',
};
class DashboardActivityService {
    static async getRecentActivity(limit = 20) {
        const logs = await audit_log_model_1.AuditLog.find({})
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
        const items = logs.map((log) => {
            const entityLabel = ENTITY_LABELS[log.entity_type] ?? log.entity_type;
            const actionLabel = ACTION_LABELS[log.action] ?? log.action;
            return {
                activity_id: log.audit_id,
                title: `${entityLabel} ${actionLabel}`,
                entity_type: log.entity_type,
                entity_id: log.entity_id,
                action: log.action,
                actor_email: log.actor_email ?? null,
                timestamp: log.timestamp,
            };
        });
        return { items };
    }
}
exports.DashboardActivityService = DashboardActivityService;
//# sourceMappingURL=dashboard-activity.service.js.map