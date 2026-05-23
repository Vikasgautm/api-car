"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardComparisonService = void 0;
const car_model_1 = require("../../../models/car.model");
const comparison_model_1 = require("../../../models/comparison.model");
class DashboardComparisonService {
    static async getSummary() {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const [statusCounts, recentUpdated, totalCars] = await Promise.all([
            comparison_model_1.Comparison.aggregate([
                { $match: { is_deleted: false } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            comparison_model_1.Comparison.countDocuments({
                is_deleted: false,
                updated_at: { $gte: sevenDaysAgo },
            }),
            car_model_1.Car.countDocuments({ is_deleted: false }),
        ]);
        const counts = { published: 0, draft: 0, archived: 0 };
        let total = 0;
        for (const entry of statusCounts) {
            const key = entry._id;
            if (key in counts)
                counts[key] = entry.count;
            total += entry.count;
        }
        // Cars featured in at least one comparison
        const carsInComparisons = await comparison_model_1.Comparison.distinct('car1_id', { is_deleted: false });
        const carsWithComparisons = new Set(carsInComparisons).size;
        const carsWithoutComparisons = Math.max(0, totalCars - carsWithComparisons);
        return {
            total,
            published: counts.published,
            draft: counts.draft,
            cars_without_comparisons: carsWithoutComparisons,
            recent_updated: recentUpdated,
        };
    }
}
exports.DashboardComparisonService = DashboardComparisonService;
//# sourceMappingURL=dashboard-comparison.service.js.map