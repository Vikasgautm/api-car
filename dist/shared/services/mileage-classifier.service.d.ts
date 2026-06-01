import { BenchmarkThresholds, FuelCategory, IceFuelType, MileageClass, MileageSource } from '../../constants/mileage-benchmarks';
import { ICarVariant } from '../../models/car-variant.model';
import { ICar } from '../../models/car.model';
export interface ClassificationResult {
    mileage_class: MileageClass | null;
    mileage_class_value: number | null;
    mileage_class_source: MileageSource | null;
    range_class: MileageClass | null;
    range_class_value: number | null;
    range_class_source: MileageSource | null;
}
/**
 * Parse a numeric value out of a mileage/range string like "22.5 km/l", "350 km", or "17.4".
 * Returns null when no positive number can be extracted.
 */
export declare function parseMileageValue(input: unknown): number | null;
type CachedSnapshot = {
    bodyTypeSlugById: Map<string, string>;
    fuelCategoryById: Map<string, FuelCategory>;
    fuelTypeSlugById: Map<string, string>;
    overrides: Map<string, BenchmarkThresholds>;
};
export declare class MileageClassifierService {
    /**
     * Drop the in-memory cache. Call after editing overrides, fuel types, or body types.
     */
    static invalidateCache(): void;
    /**
     * Decide the fuel category for a variant. Logic:
     *   1. If the variant or its car points at an EV fuel type → 'ev'.
     *   2. Else if the variant has an electric_range / real_range / battery_wltp_km → 'ev'.
     *   3. Else 'ice' (hybrid and CNG both use the ICE table per spec).
     */
    static detectFuelCategory(variant: Pick<ICarVariant, 'fuel_type_id' | 'specs_normalized'>, parentCar: Pick<ICar, 'is_electric' | 'fuel_type_id'> | null, fuelCategoryById: Map<string, FuelCategory>): FuelCategory;
    /**
     * Resolve the specific ICE fuel sub-type for granular benchmark lookup.
     * Falls back to 'petrol' when the fuel type is unknown or unmatched.
     */
    static detectIceFuelType(variant: Pick<ICarVariant, 'fuel_type_id'>, fuelTypeSlugById: Map<string, string>): IceFuelType;
    /**
     * Get the thresholds for a (body_type_id, fuel_category) pair. Precedence:
     *   1. Override row for this body_type_id + fuel_category
     *   2. Fuel-specific ICE constant (ICE_FUEL_BENCHMARKS[key][iceFuelType])
     *   3. Generic ICE constant (ICE_BENCHMARKS[key], petrol defaults)
     *   4. null if neither yields a match
     */
    static resolveThresholds(bodyTypeId: string | undefined, fuelCategory: FuelCategory, snapshot: CachedSnapshot, iceFuelType?: IceFuelType): BenchmarkThresholds | null;
    /**
     * Pick the strongest mileage signal available for an ICE/hybrid/CNG variant.
     * Preference order: ARAI > real > city > highway > CNG-specific.
     */
    static pickIceValue(variant: Pick<ICarVariant, 'specs_normalized'>): {
        value: number;
        source: MileageSource;
    } | null;
    /**
     * Pick the strongest range signal for an EV variant.
     * Preference: electric_range > real_world_range > real_range > battery_wltp_km.
     */
    static pickEvValue(variant: Pick<ICarVariant, 'specs_normalized'>): {
        value: number;
        source: MileageSource;
    } | null;
    /**
     * Compute the classification result for a single variant, given the parent car
     * (already-fetched, lean OK). Returns all four fields; null where data is missing.
     */
    static classifyVariant(variant: Pick<ICarVariant, 'fuel_type_id' | 'specs_normalized'>, parentCar: Pick<ICar, 'is_electric' | 'fuel_type_id' | 'body_type_id'> | null): Promise<ClassificationResult>;
}
export {};
//# sourceMappingURL=mileage-classifier.service.d.ts.map