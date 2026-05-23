import { Car } from '../../../models/car.model';
import { CarVariant } from '../../../models/car-variant.model';
import { ContentHealthSummary } from '../dtos/dashboard.dto';

export class DashboardHealthService {
  static async getSummary(): Promise<ContentHealthSummary> {
    const [
      missingImages,
      missingSeo,
      orphanVariants,
      staleLifecycle,
      lowConfidence,
    ] = await Promise.all([
      Car.countDocuments({
        is_deleted: false,
        is_published: true,
        $or: [{ thumbnail: null }, { thumbnail: { $exists: false } }, { 'thumbnail.url': '' }],
      }),
      Car.countDocuments({
        is_deleted: false,
        $or: [
          { 'seo.meta_title': { $in: [null, ''] } },
          { 'seo.meta_description': { $in: [null, ''] } },
        ],
      }),
      CarVariant.countDocuments({
        is_deleted: false,
        car_id: { $exists: false },
      }),
      Car.countDocuments({
        is_deleted: false,
        is_upcoming: true,
        expected_launch_date: { $lt: new Date() },
      }),
      CarVariant.countDocuments({
        is_deleted: false,
        $and: [
          { field_confidence_scores: { $exists: true } },
        ],
      }),
    ]);

    // Duplicate slug detection via aggregation
    const duplicateSlugsAgg = await Car.aggregate([
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
