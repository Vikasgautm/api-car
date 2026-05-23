import { AuditLog } from '../../../models/audit-log.model';
import { Blog } from '../../../models/blog.model';

export class BlogActivityService {
  static async getRecentActivity(limit = 20) {
    const logs = await AuditLog.find({ entity_type: 'blog' })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    const blogIds = [...new Set(logs.map((l: any) => l.entity_id))];
    const blogs = await Blog.find({ blog_id: { $in: blogIds } })
      .select('blog_id title slug')
      .lean();

    const blogMap = new Map(blogs.map((b: any) => [b.blog_id, b]));

    return logs.map((log: any) => ({
      ...log,
      blog: blogMap.get(log.entity_id) ?? null,
    }));
  }

  static async getStaleAlerts(limit = 20) {
    const stale = await Blog.find({
      is_deleted: false,
      is_published: true,
      $or: [
        { freshness_score: { $lt: 60 } },
        { article_status: 'stale' },
        { stale_flags: { $exists: true, $not: { $size: 0 } } },
      ],
    })
      .select('blog_id title slug freshness_score stale_flags article_type updatedAt')
      .sort({ freshness_score: 1 })
      .limit(limit)
      .lean();

    return stale;
  }

  static async getContentHealthSummary() {
    const [total, published, stale, orphaned, missingMeta] = await Promise.all([
      Blog.countDocuments({ is_deleted: false }),
      Blog.countDocuments({ is_deleted: false, is_published: true }),
      Blog.countDocuments({ is_deleted: false, $or: [{ freshness_score: { $lt: 60 } }, { article_status: 'stale' }] }),
      Blog.countDocuments({
        is_deleted: false,
        connected_cars: { $size: 0 },
        connected_brands: { $size: 0 },
      }),
      Blog.countDocuments({
        is_deleted: false,
        $or: [{ meta_title: { $exists: false } }, { meta_description: { $exists: false } }],
      }),
    ]);

    const avgScore = await Blog.aggregate([
      { $match: { is_deleted: false, seo_health_score: { $exists: true } } },
      { $group: { _id: null, avg: { $avg: '$seo_health_score' } } },
    ]);

    return {
      total,
      published,
      drafts: total - published,
      stale,
      orphaned,
      missing_meta: missingMeta,
      avg_seo_score: avgScore[0]?.avg ? Math.round(avgScore[0].avg) : null,
    };
  }

  static async getEntityImpactAlerts() {
    const staleBlogs = await Blog.find({
      is_deleted: false,
      is_published: true,
      $or: [
        { freshness_score: { $lt: 60 } },
        { stale_flags: { $exists: true, $not: { $size: 0 } } },
      ],
    })
      .select('blog_id title connected_cars connected_brands stale_flags')
      .limit(10)
      .lean();

    return staleBlogs.map((b: any) => ({
      blog_id: b.blog_id,
      title: b.title,
      connected_cars_count: b.connected_cars?.length ?? 0,
      connected_brands_count: b.connected_brands?.length ?? 0,
      stale_flags: b.stale_flags,
      message: 'Related articles may require refresh.',
    }));
  }
}
