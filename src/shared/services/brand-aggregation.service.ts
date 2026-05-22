import { Car } from '../../models/car.model';
import { CarVariant } from '../../models/car-variant.model';
import { Brand, IBrandAggregatesCache } from '../../models/brand.model';

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const FUEL_SLUG_MAP: Record<string, string> = {
  electric: 'ev',
  ev: 'ev',
  petrol: 'petrol',
  diesel: 'diesel',
  cng: 'cng',
  'cng + petrol': 'cng',
  hybrid: 'hybrid',
  'mild hybrid': 'mild-hybrid',
  'strong hybrid': 'strong-hybrid',
  hydrogen: 'hydrogen',
  lpg: 'lpg',
};

function fuelSlug(fuelName: string): string {
  const lower = fuelName.toLowerCase().trim();
  return FUEL_SLUG_MAP[lower] || toSlug(fuelName);
}

export class BrandAggregationService {
  static async computeAndCache(brandId: string): Promise<IBrandAggregatesCache | null> {
    const brand = await Brand.findOne({ brand_id: brandId, is_deleted: false }).lean();
    if (!brand) return null;

    const cars = await Car.find({ brand_id: brandId, is_deleted: false })
      .select(
        'car_id name body_type_id body_type_name aggregated_fuel_types ' +
          'min_variant_price max_variant_price sunroof_available adas_available'
      )
      .lean();

    const carIds = cars.map((c: any) => c.car_id);

    if (carIds.length === 0) {
      const empty: IBrandAggregatesCache = {
        total_cars: 0,
        total_variants: 0,
        body_type_distribution: [],
        fuel_type_distribution: [],
        price_range: null,
        feature_counts: { adas: 0, sunroof: 0 },
        has_ev: false,
        has_cng: false,
        last_computed_at: new Date(),
      };
      await Brand.updateOne({ brand_id: brandId }, { $set: { aggregates_cache: empty } });
      return empty;
    }

    const totalVariants = await CarVariant.countDocuments({
      car_id: { $in: carIds },
      is_deleted: false,
    });

    // Body type distribution
    const bodyMap = new Map<string, { type_id: string; type_name: string; slug: string; count: number; cars: string[] }>();
    for (const car of cars as any[]) {
      const typeId: string = car.body_type_id || 'unknown';
      const typeName: string = car.body_type_name || typeId;
      if (!bodyMap.has(typeId)) {
        bodyMap.set(typeId, { type_id: typeId, type_name: typeName, slug: toSlug(typeName), count: 0, cars: [] });
      }
      const entry = bodyMap.get(typeId)!;
      entry.count++;
      if (entry.cars.length < 5) entry.cars.push(car.name);
    }
    const body_type_distribution = Array.from(bodyMap.values())
      .map(e => ({ type_id: e.type_id, type_name: e.type_name, slug: e.slug, count: e.count, preview_cars: e.cars }))
      .sort((a, b) => b.count - a.count);

    // Fuel type distribution
    const fuelMap = new Map<string, { fuel_id: string; fuel_name: string; slug: string; count: number; cars: string[] }>();
    for (const car of cars as any[]) {
      const fuels: string[] = Array.isArray(car.aggregated_fuel_types) ? car.aggregated_fuel_types : [];
      for (const fuel of fuels) {
        if (!fuel) continue;
        const key = fuel.toLowerCase().trim();
        if (!fuelMap.has(key)) {
          fuelMap.set(key, { fuel_id: key, fuel_name: fuel, slug: fuelSlug(fuel), count: 0, cars: [] });
        }
        const entry = fuelMap.get(key)!;
        entry.count++;
        if (entry.cars.length < 5) entry.cars.push(car.name);
      }
    }
    const fuel_type_distribution = Array.from(fuelMap.values())
      .map(e => ({ fuel_id: e.fuel_id, fuel_name: e.fuel_name, slug: e.slug, count: e.count, preview_cars: e.cars }))
      .sort((a, b) => b.count - a.count);

    // Price range
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let minCarName = '';
    let maxCarName = '';
    let minCarId = '';
    let maxCarId = '';
    for (const car of cars as any[]) {
      if (car.min_variant_price && car.min_variant_price > 0 && car.min_variant_price < minPrice) {
        minPrice = car.min_variant_price;
        minCarName = car.name;
        minCarId = car.car_id;
      }
      if (car.max_variant_price && car.max_variant_price > maxPrice) {
        maxPrice = car.max_variant_price;
        maxCarName = car.name;
        maxCarId = car.car_id;
      }
    }
    const price_range =
      minPrice !== Infinity
        ? { min: minPrice, max: maxPrice, min_car_name: minCarName, max_car_name: maxCarName, min_car_id: minCarId, max_car_id: maxCarId }
        : null;

    // Feature counts (car-level aggregated flags)
    let adasCount = 0;
    let sunroofCount = 0;
    for (const car of cars as any[]) {
      if (car.adas_available) adasCount++;
      if (car.sunroof_available) sunroofCount++;
    }

    const has_ev = fuel_type_distribution.some(f => f.slug === 'ev' || f.fuel_name.toLowerCase().includes('electric'));
    const has_cng = fuel_type_distribution.some(f => f.slug === 'cng' || f.fuel_name.toLowerCase().includes('cng'));

    const result: IBrandAggregatesCache = {
      total_cars: cars.length,
      total_variants: totalVariants,
      body_type_distribution,
      fuel_type_distribution,
      price_range,
      feature_counts: { adas: adasCount, sunroof: sunroofCount },
      has_ev,
      has_cng,
      last_computed_at: new Date(),
    };

    await Brand.updateOne({ brand_id: brandId }, { $set: { aggregates_cache: result } });
    return result;
  }

  static async refreshAll(): Promise<{ processed: number; errors: number }> {
    const brands = await Brand.find({ is_deleted: false }).select('brand_id').lean();
    let processed = 0;
    let errors = 0;
    for (const brand of brands as any[]) {
      try {
        await BrandAggregationService.computeAndCache(brand.brand_id);
        processed++;
      } catch {
        errors++;
      }
    }
    return { processed, errors };
  }
}
