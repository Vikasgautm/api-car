import { Car } from '../../../models/car.model';
import { CarVariant } from '../../../models/car-variant.model';
import { ImportLog } from '../../../models/import-log.model';
import { SeoCollection } from '../../../models/seo-collection.model';
import { DashboardOverview } from '../dtos/dashboard.dto';

export class DashboardOverviewService {
  static async getOverview(): Promise<DashboardOverview> {
    const [carStats, totalVariants, totalSeoCollections, failedImports] = await Promise.all([
      Car.aggregate([
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
      CarVariant.countDocuments({ is_deleted: false }),
      SeoCollection.countDocuments({ is_deleted: false }),
      ImportLog.countDocuments({ status: 'failed' }),
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
