"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardOverviewService = void 0;
const car_model_1 = require("../../../models/car.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
const import_log_model_1 = require("../../../models/import-log.model");
const seo_collection_model_1 = require("../../../models/seo-collection.model");
class DashboardOverviewService {
    static async getOverview() {
        const [carStats, totalVariants, totalSeoCollections, failedImports] = await Promise.all([
            car_model_1.Car.aggregate([
                { $match: { is_deleted: false } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        published: { $sum: { $cond: [{ $eq: ['$is_published', true] }, 1, 0] } },
                        upcoming: { $sum: { $cond: [{ $eq: ['$is_upcoming', true] }, 1, 0] } },
                        archived: { $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] } },
                        discontinued: { $sum: { $cond: [{ $eq: ['$status', 'discontinued'] }, 1, 0] } },
                    },
                },
            ]),
            car_variant_model_1.CarVariant.countDocuments({ is_deleted: false }),
            seo_collection_model_1.SeoCollection.countDocuments({ is_deleted: false }),
            import_log_model_1.ImportLog.countDocuments({ status: 'failed' }),
        ]);
        const cars = carStats[0] ?? { total: 0, published: 0, upcoming: 0, archived: 0, discontinued: 0 };
        const draft = (cars.total || 0) - (cars.published || 0) - (cars.upcoming || 0) - (cars.archived || 0) - (cars.discontinued || 0);
        return {
            cars: {
                total: cars.total || 0,
                published: cars.published || 0,
                draft: Math.max(0, draft),
                upcoming: cars.upcoming || 0,
                archived: cars.archived || 0,
                discontinued: cars.discontinued || 0,
            },
            total_variants: totalVariants,
            total_seo_collections: totalSeoCollections,
            failed_imports: failedImports,
            pending_ai_refinements: 0,
            content_health_issues: 0,
        };
    }
}
exports.DashboardOverviewService = DashboardOverviewService;
//# sourceMappingURL=dashboard-overview.service.js.map