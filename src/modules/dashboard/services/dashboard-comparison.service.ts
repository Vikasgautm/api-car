import { Car } from '../../../models/car.model';
import { Comparison } from '../../../models/comparison.model';
import { ComparisonSummary } from '../dtos/dashboard.dto';

export class DashboardComparisonService {
  static async getSummary(): Promise<ComparisonSummary> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [statusCounts, recentUpdated, totalCars] = await Promise.all([
      Comparison.aggregate([
        { $match: { is_deleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Comparison.countDocuments({
        is_deleted: false,
        updated_at: { $gte: sevenDaysAgo },
      }),
      Car.countDocuments({ is_deleted: false }),
    ]);

    const counts = { published: 0, draft: 0, archived: 0 };
    let total = 0;
    for (const entry of statusCounts) {
      const key = entry._id as keyof typeof counts;
      if (key in counts) counts[key] = entry.count;
      total += entry.count;
    }

    // Cars featured in at least one comparison
    const carsInComparisons = await Comparison.distinct('car1_id', { is_deleted: false });
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
