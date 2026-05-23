import { Blog } from '../../../models/blog.model';

export class BlogFreshnessService {
  static async checkBlog(blogId: string) {
    const blog = await Blog.findOne({ blog_id: blogId, is_deleted: false })
      .select('blog_id title connected_cars connected_brands connected_comparisons updatedAt freshness_score stale_flags')
      .lean();

    if (!blog) throw new Error('Blog not found');

    const Car = (await import('../../../models/car.model')).Car;

    const stale_flags: string[] = [];
    let scoreDeduction = 0;

    // Check if connected cars are still active
    if (blog.connected_cars?.length) {
      const cars = await Car.find({ car_id: { $in: blog.connected_cars } })
        .select('car_id status is_published')
        .lean();

      const foundIds = new Set(cars.map((c: any) => c.car_id));
      const missingCount = blog.connected_cars.filter((id: string) => !foundIds.has(id)).length;
      const discontinuedCount = cars.filter((c: any) => c.status === 'discontinued' || !c.is_published).length;

      if (missingCount > 0) {
        stale_flags.push(`${missingCount}_connected_car(s)_not_found`);
        scoreDeduction += missingCount * 15;
      }
      if (discontinuedCount > 0) {
        stale_flags.push(`${discontinuedCount}_connected_car(s)_discontinued`);
        scoreDeduction += discontinuedCount * 10;
      }
    }

    // Age-based freshness decay
    const ageMs = Date.now() - new Date((blog as any).updatedAt as any).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    if (ageDays > 365) {
      stale_flags.push('article_older_than_1_year');
      scoreDeduction += 20;
    } else if (ageDays > 180) {
      stale_flags.push('article_older_than_6_months');
      scoreDeduction += 10;
    } else if (ageDays > 90) {
      stale_flags.push('article_older_than_3_months');
      scoreDeduction += 5;
    }

    const freshness_score = Math.max(0, 100 - scoreDeduction);
    const article_status = freshness_score < 40 ? 'stale' : undefined;

    const updateData: Record<string, any> = { freshness_score, stale_flags };
    if (article_status) updateData.article_status = article_status;

    await Blog.updateOne({ blog_id: blogId }, { $set: updateData });

    return { blog_id: blogId, freshness_score, stale_flags, article_status };
  }

  static async runBulkFreshnessCheck(limit = 200) {
    const blogs = await Blog.find({ is_deleted: false, is_published: true })
      .select('blog_id connected_cars updatedAt')
      .limit(limit)
      .lean();

    const results = await Promise.allSettled(
      blogs.map((b: any) => this.checkBlog(b.blog_id))
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const stale = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .filter((r) => r.value.freshness_score < 60).length;

    return { processed: blogs.length, succeeded, stale };
  }
}
