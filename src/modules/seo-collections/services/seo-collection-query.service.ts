import { BodyType } from '../../../models/body-type.model';
import { Brand } from '../../../models/brand.model';
import { FuelType } from '../../../models/fuel-type.model';
import { ISeoCollection } from '../../../models/seo-collection.model';
import { DiscoveryFilters } from '../../discovery/services/discovery.service';

export class SeoCollectionQueryService {
  static async buildDiscoveryFilters(collection: Partial<ISeoCollection>): Promise<DiscoveryFilters> {
    const filters: DiscoveryFilters = {};

    if (collection.fuel_type_ids?.length) {
      const fuelTypes = await FuelType.find({ fuel_type_id: { $in: collection.fuel_type_ids } }).select('slug').lean();
      if (fuelTypes.length) filters.fuel_type_slugs = fuelTypes.map((ft: any) => ft.slug);
    }

    if (collection.body_type_ids?.length) {
      const bodyTypes = await BodyType.find({ body_type_id: { $in: collection.body_type_ids } }).select('slug').lean();
      if (bodyTypes.length) filters.body_type_slugs = bodyTypes.map((bt: any) => bt.slug);
    }

    if (collection.brand_ids?.length) {
      const brands = await Brand.find({ brand_id: { $in: collection.brand_ids } }).select('slug').lean();
      if (brands.length) filters.brand_slugs = brands.map((b: any) => b.slug);
    }

    if (collection.transmission_types?.length) {
      filters.transmission = collection.transmission_types;
    }

    if (collection.seating_capacities?.length) {
      filters.seating_min = Math.min(...collection.seating_capacities);
      filters.seating_max = Math.max(...collection.seating_capacities);
    }

    if (collection.mileage_classes?.length) {
      filters.mileage_class = collection.mileage_classes;
    }

    if (collection.budget_min != null) filters.min_price = collection.budget_min;
    if (collection.budget_max != null) filters.max_price = collection.budget_max;

    const FEATURE_FLAG_MAP: Record<string, keyof DiscoveryFilters> = {
      has_sunroof: 'has_sunroof',
      has_panoramic_sunroof: 'has_panoramic_sunroof',
      has_adas: 'has_adas',
      has_ventilated_seats: 'has_ventilated_seats',
      has_camera_360: 'has_camera_360',
      has_connected_car: 'has_connected_car',
      has_wireless_charger: 'has_wireless_charger',
      has_air_purifier: 'has_air_purifier',
    };
    if (collection.feature_flags?.length) {
      for (const flag of collection.feature_flags) {
        const key = FEATURE_FLAG_MAP[flag];
        if (key) (filters as any)[key] = true;
      }
    }

    const USAGE_INTENT_MAP: Record<string, keyof DiscoveryFilters> = {
      city_friendly: 'city_friendly',
      highway_friendly: 'highway_friendly',
      offroad_ready: 'offroad_ready',
      budget_friendly: 'budget_friendly',
      feature_loaded: 'feature_loaded',
      premium_cabin: 'premium_cabin',
    };
    if (collection.usage_intents?.length) {
      for (const intent of collection.usage_intents) {
        const key = USAGE_INTENT_MAP[intent];
        if (key) (filters as any)[key] = true;
      }
    }

    if (collection.family_intents?.includes('family_friendly')) {
      filters.family_friendly = true;
    }

    // Only index launched cars
    filters.status = 'launched';

    return filters;
  }
}
