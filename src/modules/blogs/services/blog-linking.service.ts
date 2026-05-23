import { Blog } from '../../../models/blog.model';

interface LinkSuggestion {
  text: string;
  url: string;
  type: 'car' | 'brand' | 'fuel' | 'comparison' | 'collection' | 'blog';
  entity_id: string;
}

export class BlogLinkingService {
  static async suggestLinks(content: string): Promise<LinkSuggestion[]> {
    if (!content || content.length < 10) return [];

    const plainText = content.replace(/<[^>]+>/g, ' ').toLowerCase();
    const suggestions: LinkSuggestion[] = [];

    const [Car, Brand, FuelType] = await Promise.all([
      import('../../../models/car.model').then((m) => m.Car),
      import('../../../models/brand.model').then((m) => m.Brand),
      import('../../../models/fuel-type.model').then((m) => m.FuelType),
    ]);

    const [cars, brands, fuels] = await Promise.all([
      Car.find({ is_deleted: false, is_published: true }).select('car_id name slug').limit(200).lean(),
      Brand.find({ is_deleted: false }).select('brand_id name slug').limit(100).lean(),
      FuelType.find({}).select('fuel_type_id name slug').limit(20).lean(),
    ]);

    for (const car of cars as any[]) {
      if (plainText.includes(car.name.toLowerCase())) {
        suggestions.push({
          text: car.name,
          url: `/cars/${car.slug}`,
          type: 'car',
          entity_id: car.car_id,
        });
      }
    }

    for (const brand of brands as any[]) {
      if (plainText.includes(brand.name.toLowerCase())) {
        suggestions.push({
          text: brand.name,
          url: `/brands/${brand.slug}`,
          type: 'brand',
          entity_id: brand.brand_id,
        });
      }
    }

    for (const fuel of fuels as any[]) {
      if (plainText.includes(fuel.name.toLowerCase())) {
        suggestions.push({
          text: fuel.name,
          url: `/fuel-types/${fuel.slug}`,
          type: 'fuel',
          entity_id: fuel.fuel_type_id,
        });
      }
    }

    // Deduplicate by entity_id
    const seen = new Set<string>();
    return suggestions.filter((s) => {
      if (seen.has(s.entity_id)) return false;
      seen.add(s.entity_id);
      return true;
    });
  }

  static async searchEntities(query: string, entityType: string) {
    if (!query || query.length < 2) return [];
    const q = new RegExp(query, 'i');

    if (entityType === 'car') {
      const Car = (await import('../../../models/car.model')).Car;
      return Car.find({ name: q, is_deleted: false }).select('car_id name slug').limit(10).lean();
    }
    if (entityType === 'brand') {
      const Brand = (await import('../../../models/brand.model')).Brand;
      return Brand.find({ name: q, is_deleted: false }).select('brand_id name slug').limit(10).lean();
    }
    if (entityType === 'fuel_type') {
      const FuelType = (await import('../../../models/fuel-type.model')).FuelType;
      return FuelType.find({ name: q }).select('fuel_type_id name slug').limit(10).lean();
    }
    if (entityType === 'body_type') {
      const BodyType = (await import('../../../models/body-type.model')).BodyType;
      return BodyType.find({ name: q }).select('body_type_id name slug').limit(10).lean();
    }
    if (entityType === 'comparison') {
      const Comparison = (await import('../../../models/comparison.model')).Comparison;
      return Comparison.find({ title: q, is_deleted: false }).select('comparison_id title slug').limit(10).lean();
    }
    if (entityType === 'collection') {
      const SeoCollection = (await import('../../../models/seo-collection.model')).SeoCollection;
      return SeoCollection.find({ title: q, is_deleted: false }).select('collection_id title slug').limit(10).lean();
    }
    if (entityType === 'blog') {
      return Blog.find({ title: q, is_deleted: false, is_published: true }).select('blog_id title slug').limit(10).lean();
    }

    return [];
  }
}
