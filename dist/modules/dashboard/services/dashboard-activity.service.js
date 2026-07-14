"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardActivityService = void 0;
const audit_log_model_1 = require("../../../models/audit-log.model");
const dbConnection_1 = require("../../../sql/utils/dbConnection");
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
    seo_collection: 'SEO Collection',
    comparison: 'Comparison',
    import: 'Import',
    brand: 'Brand',
    user: 'User',
    setting: 'Setting',
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
        const pool = await (0, dbConnection_1.getPool)();
        const fetchCars = async () => {
            if (!carIds.length)
                return [];
            const request = pool.request();
            const inParams = carIds.map((id, index) => {
                const paramName = `car_${index}`;
                request.input(paramName, dbConnection_1.mssql.NVarChar, id);
                return `@${paramName}`;
            });
            const query = `SELECT car_id, name FROM Cars WHERE car_id IN (${inParams.join(', ')})`;
            const res = await request.query(query);
            return res.recordset;
        };
        const fetchVariants = async () => {
            if (!variantIds.length)
                return [];
            const request = pool.request();
            const inParams = variantIds.map((id, index) => {
                const paramName = `var_${index}`;
                request.input(paramName, dbConnection_1.mssql.NVarChar, id);
                return `@${paramName}`;
            });
            const query = `SELECT variant_id, variant_name FROM CarVariants WHERE variant_id IN (${inParams.join(', ')})`;
            const res = await request.query(query);
            return res.recordset;
        };
        const fetchBlogs = async () => {
            if (!blogIds.length)
                return [];
            const request = pool.request();
            const inParams = blogIds.map((id, index) => {
                const paramName = `blog_${index}`;
                request.input(paramName, dbConnection_1.mssql.NVarChar, id);
                return `@${paramName}`;
            });
            const query = `SELECT blog_id, title FROM Blogs WHERE blog_id IN (${inParams.join(', ')})`;
            const res = await request.query(query);
            return res.recordset;
        };
        const [carDocs, variantDocs, blogDocs] = await Promise.all([
            fetchCars(),
            fetchVariants(),
            fetchBlogs(),
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
            // Build a rich title: "Honda City — created" or "Car — created (ID: abc123)" as fallback
            const title = entityName
                ? `${entityName} — ${actionLabel}`
                : `${entityLabel} — ${actionLabel}`;
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
