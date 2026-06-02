"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardActivityService = void 0;
const blog_model_1 = require("../../../models/blog.model");
const car_model_1 = require("../../../models/car.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
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
    clone: 'cloned',
};
const ENTITY_LABELS = {
    car: 'Car',
    variant: 'Variant',
    tag: 'Tag',
    tag_category: 'Tag Category',
    benchmark_override: 'Benchmark Override',
    blog: 'Blog',
};
function adminRedirectLink(entityType, entityId) {
    switch (entityType) {
        case 'car': return `/cars?editId=${entityId}`;
        case 'variant': return `/variants/${entityId}/edit`;
        case 'blog': return `/blogs`;
        default: return '/audit';
    }
}
class DashboardActivityService {
    static async getRecentActivity(limit = 20) {
        const logs = await audit_log_model_1.AuditLog.find({})
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
        if (!logs.length)
            return { items: [] };
        // Gather unique entity IDs per type for batch lookup
        const carIds = [...new Set(logs.filter(l => l.entity_type === 'car').map(l => l.entity_id))];
        const variantIds = [...new Set(logs.filter(l => l.entity_type === 'variant').map(l => l.entity_id))];
        const blogIds = [...new Set(logs.filter(l => l.entity_type === 'blog').map(l => l.entity_id))];
        const [carDocs, variantDocs, blogDocs] = await Promise.all([
            carIds.length ? car_model_1.Car.find({ car_id: { $in: carIds } }).select('car_id name').lean() : [],
            variantIds.length ? car_variant_model_1.CarVariant.find({ variant_id: { $in: variantIds } }).select('variant_id variant_name').lean() : [],
            blogIds.length ? blog_model_1.Blog.find({ blog_id: { $in: blogIds } }).select('blog_id title').lean() : [],
        ]);
        const carNames = new Map(carDocs.map((c) => [c.car_id, c.name]));
        const variantNames = new Map(variantDocs.map((v) => [v.variant_id, v.variant_name]));
        const blogNames = new Map(blogDocs.map((b) => [b.blog_id, b.title]));
        const items = logs.map((log) => {
            const entityLabel = ENTITY_LABELS[log.entity_type] ?? log.entity_type;
            const actionLabel = ACTION_LABELS[log.action] ?? log.action;
            let entityName = null;
            if (log.entity_type === 'car')
                entityName = carNames.get(log.entity_id) ?? null;
            else if (log.entity_type === 'variant')
                entityName = variantNames.get(log.entity_id) ?? null;
            else if (log.entity_type === 'blog')
                entityName = blogNames.get(log.entity_id) ?? null;
            const title = entityName
                ? `${entityName} ${actionLabel}`
                : `${entityLabel} ${actionLabel}`;
            return {
                activity_id: log.audit_id,
                title,
                entity_type: log.entity_type,
                entity_id: log.entity_id,
                entity_name: entityName,
                action: log.action,
                actor_email: log.actor_email ?? null,
                timestamp: log.timestamp,
                redirect_link: adminRedirectLink(log.entity_type, log.entity_id),
            };
        });
        return { items };
    }
}
exports.DashboardActivityService = DashboardActivityService;
//# sourceMappingURL=dashboard-activity.service.js.map