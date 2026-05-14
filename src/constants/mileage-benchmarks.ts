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

export type MileageSource =
  | 'arai'
  | 'real'
  | 'city'
  | 'highway'
  | 'cng'
  | 'electric_range'
  | 'real_range'
  | 'real_world_range'
  | 'battery_wltp_km';

export const MILEAGE_CLASS_ORDER: Record<MileageClass, number> = {
  weak: 0,
  average: 1,
  good: 2,
  excellent: 3,
};

export interface BenchmarkThresholds {
  weak_max: number;
  average_max: number;
  good_max: number;
}

/**
 * Canonical benchmark keys. Resolve a body-type slug or name to one of these via
 * `resolveBenchmarkKey()` below.
 */
export type BenchmarkKey =
  | 'hatchback'
  | 'sedan'
  | 'compact-sedan'
  | 'compact-suv'
  | 'mid-size-suv'
  | 'full-size-suv'
  | 'muv'
  | 'minivan'
  | 'pickup'
  | 'coupe'
  | 'convertible';

export const ICE_BENCHMARKS: Record<BenchmarkKey, BenchmarkThresholds> = {
  hatchback:       { weak_max: 14, average_max: 18, good_max: 22 },
  sedan:           { weak_max: 13, average_max: 17, good_max: 21 },
  'compact-sedan': { weak_max: 15, average_max: 18, good_max: 22 },
  'compact-suv':   { weak_max: 12, average_max: 16, good_max: 20 },
  'mid-size-suv':  { weak_max: 10, average_max: 14, good_max: 18 },
  'full-size-suv': { weak_max:  8, average_max: 12, good_max: 15 },
  muv:             { weak_max: 10, average_max: 14, good_max: 18 },
  minivan:         { weak_max:  9, average_max: 13, good_max: 17 },
  pickup:          { weak_max:  8, average_max: 12, good_max: 15 },
  coupe:           { weak_max:  8, average_max: 12, good_max: 16 },
  convertible:     { weak_max:  7, average_max: 11, good_max: 15 },
};

export const EV_BENCHMARKS: Partial<Record<BenchmarkKey, BenchmarkThresholds>> = {
  hatchback:       { weak_max: 180, average_max: 280, good_max: 400 },
  sedan:           { weak_max: 250, average_max: 400, good_max: 550 },
  'compact-suv':   { weak_max: 220, average_max: 350, good_max: 500 },
  'mid-size-suv':  { weak_max: 280, average_max: 420, good_max: 550 },
  'full-size-suv': { weak_max: 320, average_max: 500, good_max: 650 },
  muv:             { weak_max: 250, average_max: 380, good_max: 500 },
  pickup:          { weak_max: 300, average_max: 450, good_max: 650 },
  coupe:           { weak_max: 300, average_max: 500, good_max: 700 },
  convertible:     { weak_max: 250, average_max: 450, good_max: 600 },
  // 'compact-sedan' and 'minivan' have no EV table in the spec — fall back to sedan / muv.
};

/**
 * Body-type slugs vary across data sources, so we resolve via fuzzy keyword matching
 * rather than exact slug equality. Returns null if no reasonable mapping exists.
 */
export function resolveBenchmarkKey(bodyTypeSlugOrName: string | undefined | null): BenchmarkKey | null {
  if (!bodyTypeSlugOrName) return null;
  const s = bodyTypeSlugOrName.toLowerCase().replace(/[\s_]+/g, '-');

  if (s.includes('convertible') || s.includes('cabriolet') || s.includes('roadster')) return 'convertible';
  if (s.includes('coupe')) return 'coupe';
  if (s.includes('pickup') || s.includes('truck')) return 'pickup';
  if (s.includes('minivan') || s.includes('van')) return 'minivan';

  // SUV variants need to be checked before bare 'suv'.
  const isSuv = s.includes('suv');
  if (isSuv) {
    if (s.includes('full') || s.includes('large')) return 'full-size-suv';
    if (s.includes('mid')) return 'mid-size-suv';
    if (s.includes('compact') || s.includes('sub')) return 'compact-suv';
    return 'compact-suv'; // Default for bare "SUV"
  }

  if (s.includes('muv') || s.includes('mpv') || s.includes('multi-purpose') || s.includes('people')) return 'muv';

  if (s.includes('hatchback') || s.includes('hatch')) return 'hatchback';

  if (s.includes('sedan')) {
    if (s.includes('compact') || s.includes('sub')) return 'compact-sedan';
    return 'sedan';
  }

  return null;
}

/**
 * Classify a numeric value against a threshold set. Returns null when value is
 * missing or non-finite.
 */
export function applyThresholds(value: number | null | undefined, t: BenchmarkThresholds): MileageClass | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (value < t.weak_max) return 'weak';
  if (value < t.average_max) return 'average';
  if (value < t.good_max) return 'good';
  return 'excellent';
}

/**
 * Pick the higher of two classes by `MILEAGE_CLASS_ORDER`. Either side may be null.
 */
export function maxClass(a: MileageClass | null | undefined, b: MileageClass | null | undefined): MileageClass | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return MILEAGE_CLASS_ORDER[a] >= MILEAGE_CLASS_ORDER[b] ? a : b;
}
