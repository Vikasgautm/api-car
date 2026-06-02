import { Blog } from '../../../models/blog.model';
import { Car } from '../../../models/car.model';
import { CarVariant } from '../../../models/car-variant.model';
import { Comparison } from '../../../models/comparison.model';
import { SeoCollection } from '../../../models/seo-collection.model';
import { GlobalSearchResponse, GlobalSearchResult } from '../dtos/dashboard.dto';

export class DashboardSearchService {
  static async search(query: string, limit = 5): Promise<GlobalSearchResponse> {
    if (!query || query.trim().length < 2) {
      return { cars: [], variants: [], seo_collections: [], comparisons: [], blogs: [], total: 0 };
    }

    const q = query.trim();
    const regex = new RegExp(q, 'i');

    const [cars, variants, collections, comparisons, blogs] = await Promise.all([
      Car.find({ is_deleted: false, $or: [{ name: regex }, { slug: regex }] })
        .limit(limit)
        .select('car_id name slug brand_id status')
        .lean(),
      CarVariant.find({ is_deleted: false, $or: [{ variant_name: regex }, { variant_id: regex }] })
        .limit(limit)
        .select('variant_id variant_name car_id fuel_type_id')
        .lean(),
      SeoCollection.find({ is_deleted: false, $or: [{ title: regex }, { slug: regex }] })
        .limit(limit)
        .select('collection_id title slug status')
        .lean(),
      Comparison.find({ is_deleted: false, $or: [{ title: regex }, { slug: regex }] })
        .limit(limit)
        .select('comparison_id title slug status')
        .lean(),
      Blog.find({ is_deleted: false, $or: [{ title: regex }, { slug: regex }] })
        .limit(limit)
        .select('blog_id title slug')
        .lean(),
    ]);

    const carResults: GlobalSearchResult[] = cars.map((c: any) => ({
      type: 'car',
      id: c.car_id,
      title: c.name,
      subtitle: c.status,
      link: `/cars?editId=${c.car_id}`,
    }));

    const variantResults: GlobalSearchResult[] = variants.map((v: any) => ({
      type: 'variant',
      id: v.variant_id,
      title: v.variant_name,
      subtitle: v.fuel_type_id ?? undefined,
      link: `/variants/${v.variant_id}/edit`,
    }));

    const collectionResults: GlobalSearchResult[] = collections.map((s: any) => ({
      type: 'seo_collection',
      id: s.collection_id,
      title: s.title,
      subtitle: s.status,
      link: `/seo-collection-editor/${s.collection_id}`,
    }));

    const comparisonResults: GlobalSearchResult[] = comparisons.map((c: any) => ({
      type: 'comparison',
      id: c.comparison_id,
      title: c.title,
      subtitle: c.status,
      link: `/comparison/${c.comparison_id}`,
    }));

    const blogResults: GlobalSearchResult[] = blogs.map((b: any) => ({
      type: 'blog',
      id: b.blog_id,
      title: b.title,
      link: `/blogs`,
    }));

    const total = carResults.length + variantResults.length + collectionResults.length + comparisonResults.length + blogResults.length;

    return {
      cars: carResults,
      variants: variantResults,
      seo_collections: collectionResults,
      comparisons: comparisonResults,
      blogs: blogResults,
      total,
    };
  }
}
