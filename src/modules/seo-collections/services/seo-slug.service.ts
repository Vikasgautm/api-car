import { BodyType } from '../../../models/body-type.model';
import { Brand } from '../../../models/brand.model';
import { FuelType } from '../../../models/fuel-type.model';
import { SeoCollection } from '../../../models/seo-collection.model';
import { SlugUtil } from '../../../shared/utils/slug.util';

export class SeoSlugService {
  static async generate(params: {
    collection_type: string;
    fuel_type_ids?: string[];
    body_type_ids?: string[];
    brand_ids?: string[];
    transmission_types?: string[];
    budget_max?: number | null;
    budget_min?: number | null;
    seating_capacities?: number[];
    mileage_classes?: string[];
    feature_flags?: string[];
  }): Promise<string> {
    const parts: string[] = [];

    if (params.fuel_type_ids?.length) {
      const fuelTypes = await FuelType.find({ fuel_type_id: { $in: params.fuel_type_ids } }).select('name').lean();
      for (const ft of fuelTypes) parts.push(SlugUtil.generate(ft.name));
    }

    if (params.body_type_ids?.length) {
      const bodyTypes = await BodyType.find({ body_type_id: { $in: params.body_type_ids } }).select('name').lean();
      for (const bt of bodyTypes) parts.push(SlugUtil.generate(bt.name));
    }

    if (params.brand_ids?.length) {
      const brands = await Brand.find({ brand_id: { $in: params.brand_ids } }).select('name').lean();
      for (const b of brands) parts.push(SlugUtil.generate(b.name));
    }

    if (params.transmission_types?.length === 1) {
      parts.push(SlugUtil.generate(params.transmission_types[0]));
    }

    if (params.mileage_classes?.length && params.mileage_classes.includes('excellent')) {
      parts.unshift('best-mileage');
    }

    // Always end base with "cars"
    parts.push('cars');

    if (params.budget_max) {
      const lakhs = Math.round(params.budget_max / 100000);
      parts.push(`under-${lakhs}-lakh`);
    } else if (params.budget_min) {
      const lakhs = Math.round(params.budget_min / 100000);
      parts.push(`above-${lakhs}-lakh`);
    }

    const baseSlug = parts.join('-');
    return this.ensureUnique(baseSlug);
  }

  static async ensureUnique(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const q: Record<string, any> = { slug, is_deleted: false };
      if (excludeId) q.collection_id = { $ne: excludeId };
      const exists = await SeoCollection.exists(q);
      if (!exists) return slug;
      slug = `${baseSlug}-${counter++}`;
    }
  }
}
