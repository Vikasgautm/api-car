"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardSeoService = void 0;
const seo_collection_model_1 = require("../../../models/seo-collection.model");
class DashboardSeoService {
    static async getSummary() {
        const [statusCounts, weak, empty] = await Promise.all([
            seo_collection_model_1.SeoCollection.aggregate([
                { $match: { is_deleted: false } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ]),
            seo_collection_model_1.SeoCollection.countDocuments({
                is_deleted: false,
                matched_car_count: { $gt: 0, $lt: 3 },
            }),
            seo_collection_model_1.SeoCollection.countDocuments({
                is_deleted: false,
                matched_car_count: 0,
            }),
        ]);
        const counts = { published: 0, draft: 0, archived: 0 };
        let total = 0;
        for (const entry of statusCounts) {
            const key = entry._id;
            if (key in counts)
                counts[key] = entry.count;
            total += entry.count;
        }
        return {
            total,
            published: counts.published,
            draft: counts.draft,
            archived: counts.archived,
            weak,
            empty,
        };
    }
}
exports.DashboardSeoService = DashboardSeoService;
//# sourceMappingURL=dashboard-seo.service.js.map