import { MILEAGE_CLASS_ORDER, MileageClass } from '../../constants/mileage-benchmarks';
import { CarVariant, ICarVariant } from '../../models/car-variant.model';
import { Car } from '../../models/car.model';
import { FuelType } from '../../models/fuel-type.model';
import { MileageClassifierService } from './mileage-classifier.service';

// Map fuel-type slug/name to a single display label used in `aggregated_fuel_types`.
// Spec: electric/BEV must render as "EV", not "Electric".
const fuelDisplayLabel = (name?: string | null, slug?: string | null): string => {
  const key = (slug || name || '').toLowerCase();
  if (key === 'electric' || key === 'ev' || key === 'bev') return 'EV';
  return name || slug || '';
};

export class MileageRecomputeService {
  /**
   * Reclassify a single variant in-place and persist the result.
   * `parentCar` may be passed when the caller already has it; otherwise we fetch it.
   * Returns the updated variant (or null if it could not be found/saved).
   */
  static async recomputeVariant(
    variantId: string,
    parentCarOverride?: Pick<import('../../models/car.model').ICar, 'is_electric' | 'fuel_type_id' | 'body_type_id' | 'car_id'> | null
  ): Promise<ICarVariant | null> {
    const variant = await CarVariant.findOne({ variant_id: variantId, is_deleted: false });
    if (!variant) return null;

    const parentCar =
      parentCarOverride !== undefined
        ? parentCarOverride
        : await Car.findOne({ car_id: variant.car_id, is_deleted: false })
            .select('car_id is_electric fuel_type_id body_type_id')
            .lean();

    const result = await MileageClassifierService.classifyVariant(variant, parentCar ?? null);

    variant.mileage_class = result.mileage_class;
    variant.mileage_class_value = result.mileage_class_value;
    variant.mileage_class_source = result.mileage_class_source;
    variant.range_class = result.range_class;
    variant.range_class_value = result.range_class_value;
    variant.range_class_source = result.range_class_source;

    await variant.save();
    return variant;
  }

  /**
   * Reclassify every non-deleted variant under a car and update the car's
   * aggregate fields. Returns the number of variants touched.
   */
  static async recomputeCar(carId: string): Promise<number> {
    const parentCar = await Car.findOne({ car_id: carId, is_deleted: false })
      .select('car_id is_electric fuel_type_id body_type_id')
      .lean();
    if (!parentCar) return 0;

    const variants = await CarVariant.find({ car_id: carId, is_deleted: false });

    // Build bulk operations for all variants
    const bulkOps: any[] = [];

    for (const variant of variants) {
      const result = await MileageClassifierService.classifyVariant(variant, parentCar);
      bulkOps.push({
        updateOne: {
          filter: { _id: variant._id },
          update: {
            $set: {
              mileage_class: result.mileage_class,
              mileage_class_value: result.mileage_class_value,
              mileage_class_source: result.mileage_class_source,
              range_class: result.range_class,
              range_class_value: result.range_class_value,
              range_class_source: result.range_class_source,
            }
          }
        }
      });
    }

    // Execute all updates in one batch
    if (bulkOps.length > 0) {
      await CarVariant.bulkWrite(bulkOps);
    }

    await this.recomputeCarAggregatesOnly(carId);
    return variants.length;
  }

  /**
   * Recompute just the parent car's aggregate fields from the current variant rows.
   * Cheaper than `recomputeCar` — call this after a single variant has already been
   * reclassified.
   */
  static async recomputeCarAggregatesOnly(carId: string): Promise<void> {
    const variants = await CarVariant.find({
      car_id: carId,
      is_deleted: false,
      is_archived: false,
    })
      .select('mileage_class mileage_class_value range_class range_class_value fuel_type_id ex_showroom_price expected_price transmission_type')
      .lean();

    const best = (a?: MileageClass | null, b?: MileageClass | null): MileageClass | null => {
      if (!a) return b ?? null;
      if (!b) return a;
      return MILEAGE_CLASS_ORDER[a] >= MILEAGE_CLASS_ORDER[b] ? a : b;
    };

    let bestMileageClass: MileageClass | null = null;
    let bestMileageValue: number | null = null;
    let bestRangeClass: MileageClass | null = null;
    let bestRangeValue: number | null = null;
    let minPrice: number | null = null;
    let maxPrice: number | null = null;
    let incompleteCount = 0;
    const fuelIds = new Set<string>();

    for (const v of variants) {
      bestMileageClass = best(bestMileageClass, v.mileage_class as MileageClass | null | undefined);
      if (typeof v.mileage_class_value === 'number') {
        bestMileageValue = bestMileageValue == null
          ? v.mileage_class_value
          : Math.max(bestMileageValue, v.mileage_class_value);
      }
      bestRangeClass = best(bestRangeClass, v.range_class as MileageClass | null | undefined);
      if (typeof v.range_class_value === 'number') {
        bestRangeValue = bestRangeValue == null
          ? v.range_class_value
          : Math.max(bestRangeValue, v.range_class_value);
      }
      // Effective price: prefer ex_showroom_price (launched variants), fall back to expected_price (upcoming).
      const price =
        typeof v.ex_showroom_price === 'number' && v.ex_showroom_price > 0
          ? v.ex_showroom_price
          : typeof v.expected_price === 'number' && v.expected_price > 0
            ? v.expected_price
            : null;
      if (price != null) {
        minPrice = minPrice == null ? price : Math.min(minPrice, price);
        maxPrice = maxPrice == null ? price : Math.max(maxPrice, price);
      }
      if (v.fuel_type_id) fuelIds.add(v.fuel_type_id);

      // A variant is "incomplete" if a customer couldn't meaningfully shop it:
      // missing transmission, no price (ex_showroom or expected), or no fuel type.
      const hasPrice = price != null;
      const hasTransmission = typeof v.transmission_type === 'string' && v.transmission_type.length > 0;
      const hasFuel = typeof v.fuel_type_id === 'string' && v.fuel_type_id.length > 0;
      if (!hasPrice || !hasTransmission || !hasFuel) {
        incompleteCount++;
      }
    }

    // Resolve fuel-type IDs to display labels (applies "EV" mapping for electric).
    // De-dupe by label so a car with two "Electric" fuel-type rows still shows one "EV".
    let aggregatedFuelTypes: string[] = [];
    if (fuelIds.size > 0) {
      const fuelDocs = await FuelType.find({ fuel_type_id: { $in: Array.from(fuelIds) }, is_deleted: false })
        .select('fuel_type_id name slug')
        .lean();
      const labelSet = new Set<string>();
      for (const f of fuelDocs) {
        const label = fuelDisplayLabel(f.name, f.slug);
        if (label) labelSet.add(label);
      }
      aggregatedFuelTypes = Array.from(labelSet).sort();
    }

    await Car.updateOne(
      { car_id: carId },
      {
        $set: {
          best_mileage_class: bestMileageClass,
          best_mileage_value: bestMileageValue,
          best_range_class: bestRangeClass,
          best_range_value: bestRangeValue,
          variant_count: variants.length,
          incomplete_variant_count: incompleteCount,
          min_variant_price: minPrice,
          max_variant_price: maxPrice,
          aggregated_fuel_types: aggregatedFuelTypes,
        },
      }
    );
  }
}
