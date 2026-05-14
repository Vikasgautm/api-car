/**
 * Body-type-aware mileage and EV-range benchmarks for the Indian market.
 *
 * Thresholds are stored as a single `max-exclusive` value per tier so admin overrides
 * can store the same shape. A value V is classified as:
 *   - 'weak'      if V <  weak_max
 *   - 'average'   if V <  average_max
 *   - 'good'      if V <  good_max
 *   - 'excellent' if V >= good_max
 *
 * The seed values are based on the spec; admins can override per (body_type_id, fuel_category)
 * via the MileageBenchmarkOverride collection.
 */
export type MileageClass = 'weak' | 'average' | 'good' | 'excellent';
export type FuelCategory = 'ice' | 'ev';
export type MileageSource = 'arai' | 'real' | 'city' | 'highway' | 'cng' | 'electric_range' | 'real_range' | 'real_world_range' | 'battery_wltp_km';
export declare const MILEAGE_CLASS_ORDER: Record<MileageClass, number>;
export interface BenchmarkThresholds {
    weak_max: number;
    average_max: number;
    good_max: number;
}
/**
 * Canonical benchmark keys. Resolve a body-type slug or name to one of these via
 * `resolveBenchmarkKey()` below.
 */
export type BenchmarkKey = 'hatchback' | 'sedan' | 'compact-sedan' | 'compact-suv' | 'mid-size-suv' | 'full-size-suv' | 'muv' | 'minivan' | 'pickup' | 'coupe' | 'convertible';
export declare const ICE_BENCHMARKS: Record<BenchmarkKey, BenchmarkThresholds>;
export declare const EV_BENCHMARKS: Partial<Record<BenchmarkKey, BenchmarkThresholds>>;
/**
 * Body-type slugs vary across data sources, so we resolve via fuzzy keyword matching
 * rather than exact slug equality. Returns null if no reasonable mapping exists.
 */
export declare function resolveBenchmarkKey(bodyTypeSlugOrName: string | undefined | null): BenchmarkKey | null;
/**
 * Classify a numeric value against a threshold set. Returns null when value is
 * missing or non-finite.
 */
export declare function applyThresholds(value: number | null | undefined, t: BenchmarkThresholds): MileageClass | null;
/**
 * Pick the higher of two classes by `MILEAGE_CLASS_ORDER`. Either side may be null.
 */
export declare function maxClass(a: MileageClass | null | undefined, b: MileageClass | null | undefined): MileageClass | null;
//# sourceMappingURL=mileage-benchmarks.d.ts.map