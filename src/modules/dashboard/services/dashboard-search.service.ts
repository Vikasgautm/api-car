import { Blog } from '../../../models/blog.model';
import { Brand } from '../../../models/brand.model';
import { Car } from '../../../models/car.model';
import { CarVariant } from '../../../models/car-variant.model';
import { Comparison } from '../../../models/comparison.model';
import { FuelType } from '../../../models/fuel-type.model';
import { SeoCollection } from '../../../models/seo-collection.model';
import { GlobalSearchResponse, GlobalSearchResult } from '../dtos/dashboard.dto';

export class DashboardSearchService {
  static async search(query: string, limit = 5): Promise<GlobalSearchResponse> {
    if (!query || query.trim().length < 2) {
      return { cars: [], variants: [], seo_collections: [], comparisons: [], blogs: [], total: 0 };
    }

    const q = query.trim();
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    // Resolve brand IDs matching the query so "Honda" finds Honda City, etc.
    const matchedBrands = await Brand.find({ name: regex, is_deleted: false }).select('brand_id').lean();
    const matchedBrandIds = (matchedBrands as any[]).map((b: any) => b.brand_id);

    const carOrClauses: any[] = [{ name: regex }, { slug: regex }, { body_type_name: regex }];
    if (matchedBrandIds.length > 0) carOrClauses.push({ brand_id: { $in: matchedBrandIds } });

    const [cars, variants, collections, comparisons, blogs] = await Promise.all([
      Car.find({ is_deleted: false, $or: carOrClauses })
        .limit(limit)
        .select('car_id name slug brand_id body_type_name status')
        .lean(),
      CarVariant.find({ is_deleted: false, $or: [{ variant_name: regex }, { slug: regex }] })
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

    // Enrich car results with brand name
    const brandIds = [...new Set((cars as any[]).map((c: any) => c.brand_id).filter(Boolean))];
    const [brandDocs, fuelTypeDocs] = await Promise.all([
      brandIds.length > 0
        ? Brand.find({ brand_id: { $in: brandIds }, is_deleted: false }).select('brand_id name').lean()
        : Promise.resolve([]),
      variants.length > 0
        ? FuelType.find({ fuel_type_id: { $in: (variants as any[]).map((v: any) => v.fuel_type_id).filter(Boolean) }, is_deleted: false })
            .select('fuel_type_id name').lean()
        : Promise.resolve([]),
    ]);
    const brandNameMap = new Map((brandDocs as any[]).map((b: any) => [b.brand_id, b.name]));
    const fuelNameMap = new Map((fuelTypeDocs as any[]).map((f: any) => [f.fuel_type_id, f.name]));

    const carResults: GlobalSearchResult[] = (cars as any[]).map((c: any) => ({
      type: 'car',
      id: c.car_id,
      title: c.name,
      subtitle: [brandNameMap.get(c.brand_id), c.body_type_name, c.status].filter(Boolean).join(' · '),
      link: `/cars?editId=${c.car_id}`,
    }));

    const variantResults: GlobalSearchResult[] = (variants as any[]).map((v: any) => ({
      type: 'variant',
      id: v.variant_id,
      title: v.variant_name,
      subtitle: fuelNameMap.get(v.fuel_type_id) ?? undefined,
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
