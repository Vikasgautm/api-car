"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardPriorityService = void 0;
const car_model_1 = require("../../../models/car.model");
const import_log_model_1 = require("../../../models/import-log.model");
const seo_collection_model_1 = require("../../../models/seo-collection.model");
class DashboardPriorityService {
    static async getPriorities() {
        const [failedImports, missingSeo, missingImages, weakCollections, emptyCollections, staleUpcoming,] = await Promise.all([
            import_log_model_1.ImportLog.countDocuments({ status: 'failed' }),
            car_model_1.Car.countDocuments({
                is_deleted: false,
                is_published: true,
                $or: [
                    { 'seo.meta_title': { $in: [null, ''] } },
                    { 'seo.meta_description': { $in: [null, ''] } },
                ],
            }),
            car_model_1.Car.countDocuments({
                is_deleted: false,
                is_published: true,
                $or: [{ thumbnail: null }, { thumbnail: { $exists: false } }, { 'thumbnail.url': '' }],
            }),
            seo_collection_model_1.SeoCollection.countDocuments({
                is_deleted: false,
                matched_car_count: { $gt: 0, $lt: 3 },
            }),
            seo_collection_model_1.SeoCollection.countDocuments({
                is_deleted: false,
                matched_car_count: 0,
            }),
            car_model_1.Car.countDocuments({
                is_deleted: false,
                is_upcoming: true,
                expected_launch_date: { $lt: new Date() },
            }),
        ]);
        const duplicateSlugsAgg = await car_model_1.Car.aggregate([
            { $match: { is_deleted: false } },
            { $group: { _id: '$slug', count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } },
            { $count: 'total' },
        ]);
        const duplicateSlugs = duplicateSlugsAgg[0]?.total ?? 0;
        const items = [];
        if (failedImports > 0) {
            items.push({
                id: 'failed_imports',
                title: 'Failed Imports',
                description: `${failedImports} import(s) failed and require investigation`,
                count: failedImports,
                severity: 'critical',
                redirect_link: '/import',
                action_label: 'Review',
            });
        }
        if (duplicateSlugs > 0) {
            items.push({
                id: 'duplicate_slugs',
                title: 'Duplicate Slugs',
                description: `${duplicateSlugs} car(s) share duplicate URL slugs — causes SEO conflicts`,
                count: duplicateSlugs,
                severity: 'critical',
                redirect_link: '/cars',
                action_label: 'Fix',
            });
        }
        if (staleUpcoming > 0) {
            items.push({
                id: 'stale_lifecycle',
                title: 'Stale Upcoming Cars',
                description: `${staleUpcoming} upcoming car(s) passed expected launch date without transition`,
                count: staleUpcoming,
                severity: 'warning',
                redirect_link: '/lifecycle-archive',
                action_label: 'Review',
            });
        }
        if (emptyCollections > 0) {
            items.push({
                id: 'empty_collections',
                title: 'Empty SEO Collections',
                description: `${emptyCollections} SEO collection(s) have no matching cars`,
                count: emptyCollections,
                severity: 'warning',
                redirect_link: '/seo-collection-health',
                action_label: 'Review',
            });
        }
        if (missingImages > 0) {
            items.push({
                id: 'missing_images',
                title: 'Published Cars Missing Images',
                description: `${missingImages} published car(s) have no thumbnail`,
                count: missingImages,
                severity: 'warning',
                redirect_link: '/car-images',
                action_label: 'Fix',
            });
        }
        if (missingSeo > 0) {
            items.push({
                id: 'missing_seo',
                title: 'Missing SEO Metadata',
                description: `${missingSeo} published car(s) are missing meta title or description`,
                count: missingSeo,
                severity: 'warning',
                redirect_link: '/content-health',
                action_label: 'Fix',
            });
        }
        if (weakCollections > 0) {
            items.push({
                id: 'weak_collections',
                title: 'Weak SEO Collections',
                description: `${weakCollections} collection(s) have fewer than 3 cars — low SEO value`,
                count: weakCollections,
                severity: 'info',
                redirect_link: '/seo-collection-health',
                action_label: 'Open',
            });
        }
        // Sort by severity: critical > warning > info
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
        return {
            items,
            total_issues: items.reduce((sum, i) => sum + i.count, 0),
            critical_count: items.filter((i) => i.severity === 'critical').reduce((s, i) => s + i.count, 0),
            warning_count: items.filter((i) => i.severity === 'warning').reduce((s, i) => s + i.count, 0),
        };
    }
}
exports.DashboardPriorityService = DashboardPriorityService;
//# sourceMappingURL=dashboard-priority.service.js.map