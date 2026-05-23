"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardHealthService = void 0;
const car_model_1 = require("../../../models/car.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
class DashboardHealthService {
    static async getSummary() {
        const [missingImages, missingSeo, orphanVariants, staleLifecycle, lowConfidence,] = await Promise.all([
            car_model_1.Car.countDocuments({
                is_deleted: false,
                is_published: true,
                $or: [{ thumbnail: null }, { thumbnail: { $exists: false } }, { 'thumbnail.url': '' }],
            }),
            car_model_1.Car.countDocuments({
                is_deleted: false,
                $or: [
                    { 'seo.meta_title': { $in: [null, ''] } },
                    { 'seo.meta_description': { $in: [null, ''] } },
                ],
            }),
            car_variant_model_1.CarVariant.countDocuments({
                is_deleted: false,
                car_id: { $exists: false },
            }),
            car_model_1.Car.countDocuments({
                is_deleted: false,
                is_upcoming: true,
                expected_launch_date: { $lt: new Date() },
            }),
            car_variant_model_1.CarVariant.countDocuments({
                is_deleted: false,
                $and: [
                    { field_confidence_scores: { $exists: true } },
                ],
            }),
        ]);
        // Duplicate slug detection via aggregation
        const duplicateSlugsAgg = await car_model_1.Car.aggregate([
            { $match: { is_deleted: false } },
            { $group: { _id: '$slug', count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } },
            { $count: 'total' },
        ]);
        const duplicateSlugs = duplicateSlugsAgg[0]?.total ?? 0;
        return {
            missing_images: missingImages,
            missing_seo: missingSeo,
            broken_slugs: duplicateSlugs,
            orphan_variants: orphanVariants,
            stale_lifecycle: staleLifecycle,
            low_confidence_specs: 0,
            duplicate_slugs: duplicateSlugs,
            total_issues: missingImages + missingSeo + duplicateSlugs + orphanVariants + staleLifecycle,
        };
    }
}
exports.DashboardHealthService = DashboardHealthService;
//# sourceMappingURL=dashboard-health.service.js.map