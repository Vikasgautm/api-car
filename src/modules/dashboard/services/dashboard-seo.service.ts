import { SeoCollection } from '../../../models/seo-collection.model';
import { SeoSummary } from '../dtos/dashboard.dto';

export class DashboardSeoService {
  static async getSummary(): Promise<SeoSummary> {
    const [statusCounts, weak, empty] = await Promise.all([
      SeoCollection.aggregate([
        { $match: { is_deleted: false } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      SeoCollection.countDocuments({
        is_deleted: false,
        matched_car_count: { $gt: 0, $lt: 3 },
      }),
      SeoCollection.countDocuments({
        is_deleted: false,
        matched_car_count: 0,
      }),
    ]);

    const counts = { published: 0, draft: 0, archived: 0 };
    let total = 0;
    for (const entry of statusCounts) {
      const key = entry._id as keyof typeof counts;
      if (key in counts) counts[key] = entry.count;
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
