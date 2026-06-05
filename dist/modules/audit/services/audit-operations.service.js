"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditOperationsService = void 0;
const audit_log_model_1 = require("../../../models/audit-log.model");
const blog_model_1 = require("../../../models/blog.model");
const brand_model_1 = require("../../../models/brand.model");
const car_model_1 = require("../../../models/car.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
const comparison_model_1 = require("../../../models/comparison.model");
const faq_model_1 = require("../../../models/faq.model");
const import_log_model_1 = require("../../../models/import-log.model");
const seo_collection_model_1 = require("../../../models/seo-collection.model");
const tag_model_1 = require("../../../models/tag.model");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const content_health_service_1 = require("../../content-health/services/content-health.service");
const audit_service_1 = require("./audit.service");
class AuditOperationsService {
    // ── Entity name resolution ────────────────────────────────────────────────
    /**
     * Resolve `{ entity_type, entity_id }` pairs to human-readable names in batch,
     * one query per entity type. Returns a `"type:id" -> name` map.
     */
    static async resolveEntityNames(pairs) {
        const byType = {};
        for (const { entity_type, entity_id } of pairs) {
            if (!entity_id)
                continue;
            (byType[entity_type] ??= new Set()).add(entity_id);
        }
        const result = {};
        const add = (type, id, name) => {
            if (id && name)
                result[`${type}:${id}`] = name;
        };
        const tasks = [];
        if (byType.car) {
            const ids = Array.from(byType.car);
            tasks.push(car_model_1.Car.find({ car_id: { $in: ids } }).select('car_id name').lean().then((rows) => {
                rows.forEach((r) => add('car', r.car_id, r.name));
            }));
        }
        if (byType.variant) {
            const ids = Array.from(byType.variant);
            tasks.push(car_variant_model_1.CarVariant.find({ variant_id: { $in: ids } }).select('variant_id variant_name').lean().then((rows) => {
                rows.forEach((r) => add('variant', r.variant_id, r.variant_name));
            }));
        }
        if (byType.brand) {
            const ids = Array.from(byType.brand);
            tasks.push(brand_model_1.Brand.find({ brand_id: { $in: ids } }).select('brand_id name').lean().then((rows) => {
                rows.forEach((r) => add('brand', r.brand_id, r.name));
            }));
        }
        if (byType.comparison) {
            const ids = Array.from(byType.comparison);
            tasks.push(comparison_model_1.Comparison.find({ comparison_id: { $in: ids } }).select('comparison_id title').lean().then((rows) => {
                rows.forEach((r) => add('comparison', r.comparison_id, r.title));
            }));
        }
        if (byType.seo_collection) {
            const ids = Array.from(byType.seo_collection);
            tasks.push(seo_collection_model_1.SeoCollection.find({ collection_id: { $in: ids } }).select('collection_id title').lean().then((rows) => {
                rows.forEach((r) => add('seo_collection', r.collection_id, r.title));
            }));
        }
        if (byType.faq) {
            const ids = Array.from(byType.faq);
            tasks.push(faq_model_1.FAQ.find({ faq_id: { $in: ids } }).select('faq_id question').lean().then((rows) => {
                rows.forEach((r) => add('faq', r.faq_id, r.question));
            }));
        }
        if (byType.blog) {
            const ids = Array.from(byType.blog);
            tasks.push(blog_model_1.Blog.find({ blog_id: { $in: ids } }).select('blog_id title').lean().then((rows) => {
                rows.forEach((r) => add('blog', r.blog_id, r.title));
            }));
        }
        if (byType.tag) {
            const ids = Array.from(byType.tag);
            tasks.push(tag_model_1.Tag.find({ tag_id: { $in: ids } }).select('tag_id name').lean().then((rows) => {
                rows.forEach((r) => add('tag', r.tag_id, r.name));
            }));
        }
        await Promise.all(tasks);
        return result;
    }
    // ── TAB 1 + 2: Activity timeline (grouped events) ──────────────────────────
    /**
     * Group per-field AuditLog rows into events. recordChanges() writes one row
     * per field with an identical timestamp for a single save, so grouping by
     * (entity, action, timestamp, actor) reconstructs the original action and its
     * full set of field changes — powering both the timeline and Change Inspector.
     */
    static async getActivity(params) {
        const { page = 1, limit = 25 } = params;
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const match = {};
        if (params.entity_type)
            match.entity_type = params.entity_type;
        if (params.entity_id)
            match.entity_id = params.entity_id;
        if (params.action)
            match.action = params.action;
        if (params.actor_user_id)
            match.actor_user_id = params.actor_user_id;
        const timeFilter = {};
        if (params.from) {
            const d = new Date(params.from);
            if (!Number.isNaN(d.getTime()))
                timeFilter.$gte = d;
        }
        if (params.to) {
            const d = new Date(params.to);
            if (!Number.isNaN(d.getTime()))
                timeFilter.$lte = d;
        }
        if (Object.keys(timeFilter).length)
            match.timestamp = timeFilter;
        const pipeline = [
            { $match: match },
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: {
                        entity_type: '$entity_type',
                        entity_id: '$entity_id',
                        action: '$action',
                        timestamp: '$timestamp',
                        actor_user_id: '$actor_user_id',
                    },
                    changes: {
                        $push: {
                            field: '$field',
                            old_value: '$old_value',
                            new_value: '$new_value',
                            audit_id: '$audit_id',
                        },
                    },
                    actor_email: { $first: '$actor_email' },
                    actor_role: { $first: '$actor_role' },
                    timestamp: { $first: '$timestamp' },
                },
            },
            { $sort: { timestamp: -1 } },
            {
                $facet: {
                    events: [{ $skip: skip }, { $limit: validatedLimit }],
                    totalCount: [{ $count: 'count' }],
                },
            },
        ];
        const [agg] = await audit_log_model_1.AuditLog.aggregate(pipeline);
        const rawEvents = agg?.events ?? [];
        const total = agg?.totalCount?.[0]?.count ?? 0;
        const events = await this.hydrateEvents(rawEvents);
        return {
            events,
            pagination: pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total),
        };
    }
    /** Attach resolved entity names + actor names to raw aggregation rows. */
    static async hydrateEvents(rawEvents) {
        const namePairs = rawEvents.map((e) => ({
            entity_type: e._id.entity_type,
            entity_id: e._id.entity_id,
        }));
        const actorIds = rawEvents
            .map((e) => e._id.actor_user_id)
            .filter((id) => !!id);
        const [nameMap, userMap] = await Promise.all([
            this.resolveEntityNames(namePairs),
            audit_service_1.AuditService.hydrateUserNames(actorIds),
        ]);
        return rawEvents.map((e) => {
            const { entity_type, entity_id, action, actor_user_id, timestamp } = e._id;
            const changes = (e.changes ?? []).filter((c) => c.field != null);
            return {
                event_key: `${entity_type}:${entity_id}:${action}:${new Date(timestamp).getTime()}`,
                entity_type,
                entity_id,
                entity_name: nameMap[`${entity_type}:${entity_id}`] ?? null,
                action,
                timestamp,
                actor_user_id: actor_user_id ?? null,
                actor_name: actor_user_id ? userMap[actor_user_id]?.user_name ?? null : null,
                actor_email: e.actor_email ?? null,
                actor_role: e.actor_role ?? null,
                changes,
                change_count: changes.length,
            };
        });
    }
    // ── TAB 3: Import monitoring ────────────────────────────────────────────────
    /**
     * Confidence is derived (ImportLog has no stored score): the share of fields
     * that matched vs. total fields seen. Returns 0–100 or null when unknown.
     */
    static deriveConfidence(log) {
        const matched = Object.keys(log.matched_data ?? {}).length;
        const unmatched = Object.keys(log.unmatched_data ?? {}).length;
        const totalSeen = matched + unmatched;
        if (totalSeen === 0)
            return null;
        return Math.round((matched / totalSeen) * 100);
    }
    static async getImports(params) {
        const { page = 1, limit = 25 } = params;
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const filter = {};
        if (params.status)
            filter.status = params.status;
        if (params.import_type)
            filter.import_type = params.import_type;
        if (params.source)
            filter.source = params.source;
        const [rows, total, statusCounts] = await Promise.all([
            import_log_model_1.ImportLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(validatedLimit).lean(),
            import_log_model_1.ImportLog.countDocuments(filter),
            import_log_model_1.ImportLog.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        ]);
        const counts = { previewed: 0, saved: 0, failed: 0 };
        for (const c of statusCounts)
            counts[c._id] = c.count;
        const actorIds = rows.map((r) => r.created_by).filter(Boolean);
        const userMap = await audit_service_1.AuditService.hydrateUserNames(actorIds);
        const logs = rows.map((r) => {
            const confidence = this.deriveConfidence(r);
            return {
                import_id: r.import_id,
                source: r.source,
                import_type: r.import_type,
                source_url: r.source_url,
                car_id: r.car_id ?? null,
                variant_id: r.variant_id ?? null,
                status: r.status,
                confidence,
                is_low_confidence: confidence != null && confidence < 60,
                matched_count: Object.keys(r.matched_data ?? {}).length,
                unmatched_count: Object.keys(r.unmatched_data ?? {}).length,
                warning_count: (r.warnings ?? []).length,
                error_count: (r.error_messages ?? []).length,
                created_by: r.created_by,
                created_by_name: userMap[r.created_by]?.user_name ?? null,
                createdAt: r.createdAt,
            };
        });
        const lowConfidence = logs.filter((l) => l.is_low_confidence).length;
        return {
            summary: {
                successful: counts.saved,
                failed: counts.failed,
                previewed: counts.previewed,
                low_confidence_on_page: lowConfidence,
                total: counts.saved + counts.failed + counts.previewed,
            },
            logs,
            pagination: pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total),
        };
    }
    static async getImportDetail(importId) {
        const log = await import_log_model_1.ImportLog.findOne({ import_id: importId }).lean();
        if (!log)
            return null;
        const userMap = await audit_service_1.AuditService.hydrateUserNames([log.created_by]);
        // Return only what the detail drawer renders — the raw extracted_data blob
        // can be megabytes and is never displayed, so it's deliberately excluded.
        return {
            import_id: log.import_id,
            source: log.source,
            import_type: log.import_type,
            source_url: log.source_url,
            car_id: log.car_id ?? null,
            variant_id: log.variant_id ?? null,
            status: log.status,
            confidence: this.deriveConfidence(log),
            created_by: log.created_by,
            created_by_name: userMap[log.created_by]?.user_name ?? null,
            createdAt: log.createdAt,
            matched_fields: Object.keys(log.matched_data ?? {}),
            unmatched_fields: Object.keys(log.unmatched_data ?? {}),
            warnings: log.warnings ?? [],
            error_messages: log.error_messages ?? [],
        };
    }
    // ── TAB 4: System alerts (generated on demand, never stored) ────────────────
    static async getAlerts() {
        const now = new Date();
        const [healthResult, overdueLaunches, seoCollections] = await Promise.all([
            content_health_service_1.ContentHealthService.getIssues({ page: 1, limit: 100 }).catch(() => null),
            car_model_1.Car.find({ is_deleted: false, is_upcoming: true, expected_launch_date: { $lte: now, $ne: null } })
                .select('car_id name expected_launch_date')
                .limit(25)
                .lean()
                .catch(() => []),
            seo_collection_model_1.SeoCollection.find({
                status: 'published',
                $or: [{ auto_noindex: true }, { health_score: { $lt: 50 } }],
            })
                .select('collection_id title health_score auto_noindex')
                .limit(25)
                .lean()
                .catch(() => []),
        ]);
        const alerts = [];
        const SEVERITY_MAP = {
            critical: 'critical',
            high: 'warning',
            medium: 'info',
            low: 'info',
        };
        // Content / Import / SEO health issues grouped by category
        if (healthResult?.issues?.length) {
            const groups = {};
            const RANK = { critical: 0, high: 1, medium: 2, low: 3 };
            for (const issue of healthResult.issues) {
                const g = (groups[issue.category] ??= {
                    count: 0,
                    topSeverity: issue.severity,
                    title: issue.issue_title,
                });
                g.count += 1;
                if (RANK[issue.severity] < RANK[g.topSeverity]) {
                    g.topSeverity = issue.severity;
                    g.title = issue.issue_title;
                }
            }
            for (const [category, g] of Object.entries(groups)) {
                const sourceLabel = category.replace(/_/g, ' ').replace(/\bhealth\b/i, '').trim() || category;
                alerts.push({
                    id: `health:${category}`,
                    source: 'Content Health',
                    severity: SEVERITY_MAP[g.topSeverity] ?? 'info',
                    title: `${g.count} ${sourceLabel} issue${g.count === 1 ? '' : 's'}`,
                    description: g.title,
                    count: g.count,
                    action_label: 'View in Content Health',
                    action_url: `/content-health?category=${category}`,
                });
            }
        }
        // Lifecycle — overdue upcoming launches
        if (overdueLaunches.length) {
            alerts.push({
                id: 'lifecycle:overdue_launches',
                source: 'Lifecycle',
                severity: 'warning',
                title: `${overdueLaunches.length} upcoming launch${overdueLaunches.length === 1 ? '' : 'es'} overdue`,
                description: overdueLaunches
                    .slice(0, 3)
                    .map((c) => c.name)
                    .join(', '),
                count: overdueLaunches.length,
                action_label: 'View Cars',
                action_url: '/cars?is_upcoming=true',
            });
        }
        // SEO collections — auto-noindexed or low health
        if (seoCollections.length) {
            const noindexed = seoCollections.filter((c) => c.auto_noindex).length;
            alerts.push({
                id: 'seo:collection_health',
                source: 'SEO Collections',
                severity: noindexed ? 'warning' : 'info',
                title: `${seoCollections.length} collection${seoCollections.length === 1 ? '' : 's'} need attention`,
                description: noindexed
                    ? `${noindexed} auto-noindexed, others below health threshold`
                    : 'Health score below threshold',
                count: seoCollections.length,
                action_label: 'View Collection Health',
                action_url: '/seo-collection-health',
            });
        }
        const order = { critical: 0, warning: 1, info: 2 };
        alerts.sort((a, b) => order[a.severity] - order[b.severity]);
        return {
            alerts,
            counts: {
                critical: alerts.filter((a) => a.severity === 'critical').length,
                warning: alerts.filter((a) => a.severity === 'warning').length,
                info: alerts.filter((a) => a.severity === 'info').length,
                total: alerts.length,
            },
            generated_at: now.toISOString(),
        };
    }
    // ── TAB 6: Entity history ───────────────────────────────────────────────────
    static async searchEntities(q, limit = 8) {
        const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const results = [];
        const [cars, variants, brands, comparisons, collections] = await Promise.all([
            car_model_1.Car.find({ is_deleted: false, name: rx }).select('car_id name slug').limit(limit).lean(),
            car_variant_model_1.CarVariant.find({ is_deleted: false, variant_name: rx }).select('variant_id car_id variant_name').limit(limit).lean(),
            brand_model_1.Brand.find({ name: rx }).select('brand_id name').limit(limit).lean(),
            comparison_model_1.Comparison.find({ title: rx }).select('comparison_id title').limit(limit).lean(),
            seo_collection_model_1.SeoCollection.find({ title: rx }).select('collection_id title').limit(limit).lean(),
        ]);
        cars.forEach((c) => results.push({ entity_type: 'car', entity_id: c.car_id, label: c.name, sub: 'Car' }));
        variants.forEach((v) => results.push({ entity_type: 'variant', entity_id: v.variant_id, label: v.variant_name, sub: 'Variant' }));
        brands.forEach((b) => results.push({ entity_type: 'brand', entity_id: b.brand_id, label: b.name, sub: 'Brand' }));
        comparisons.forEach((c) => results.push({ entity_type: 'comparison', entity_id: c.comparison_id, label: c.title, sub: 'Comparison' }));
        collections.forEach((c) => results.push({ entity_type: 'seo_collection', entity_id: c.collection_id, label: c.title, sub: 'SEO Collection' }));
        return results;
    }
    /**
     * Complete chronological history of an entity: audit events + related imports.
     * For a car, this also folds in audit events for all of its variants so the
     * timeline reflects the entire model, not just the parent record.
     */
    static async getEntityHistory(entityType, entityId) {
        // Collect the set of (type, id) pairs whose audit rows belong to this entity.
        const auditTargets = [
            { entity_type: entityType, entity_id: entityId },
        ];
        let variantIds = [];
        if (entityType === 'car') {
            const variants = await car_variant_model_1.CarVariant.find({ car_id: entityId }).select('variant_id').lean();
            variantIds = variants.map((v) => v.variant_id);
            variantIds.forEach((id) => auditTargets.push({ entity_type: 'variant', entity_id: id }));
        }
        const auditOr = auditTargets.map((t) => ({ entity_type: t.entity_type, entity_id: t.entity_id }));
        const [rawEvents, imports] = await Promise.all([
            audit_log_model_1.AuditLog.aggregate([
                { $match: { $or: auditOr } },
                { $sort: { timestamp: -1 } },
                {
                    $group: {
                        _id: {
                            entity_type: '$entity_type',
                            entity_id: '$entity_id',
                            action: '$action',
                            timestamp: '$timestamp',
                            actor_user_id: '$actor_user_id',
                        },
                        changes: {
                            $push: { field: '$field', old_value: '$old_value', new_value: '$new_value', audit_id: '$audit_id' },
                        },
                        actor_email: { $first: '$actor_email' },
                        actor_role: { $first: '$actor_role' },
                        timestamp: { $first: '$timestamp' },
                    },
                },
                { $sort: { timestamp: -1 } },
                { $limit: 200 },
            ]),
            import_log_model_1.ImportLog.find({
                $or: [
                    { car_id: entityType === 'car' ? entityId : '__none__' },
                    { variant_id: { $in: entityType === 'variant' ? [entityId] : variantIds } },
                ],
            })
                .sort({ createdAt: -1 })
                .limit(50)
                .lean(),
        ]);
        const events = await this.hydrateEvents(rawEvents);
        const importEvents = imports.map((imp) => ({
            import_id: imp.import_id,
            source: imp.source,
            import_type: imp.import_type,
            status: imp.status,
            source_url: imp.source_url,
        }));
        // Unified, time-ordered timeline
        const timeline = [
            ...events.map((e) => ({ kind: 'audit', timestamp: e.timestamp, event: e })),
            ...imports.map((imp, i) => ({ kind: 'import', timestamp: imp.createdAt, event: importEvents[i] })),
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const nameMap = await this.resolveEntityNames([{ entity_type: entityType, entity_id: entityId }]);
        return {
            entity_type: entityType,
            entity_id: entityId,
            entity_name: nameMap[`${entityType}:${entityId}`] ?? null,
            variant_count: variantIds.length,
            timeline,
        };
    }
}
exports.AuditOperationsService = AuditOperationsService;
//# sourceMappingURL=audit-operations.service.js.map