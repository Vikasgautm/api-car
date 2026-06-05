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
export type FuelCategory = 'ice' | 'ev' | 'petrol' | 'diesel' | 'cng' | 'hybrid';

/** Specific ICE sub-type used for granular benchmark lookup. */
export type IceFuelType = 'petrol' | 'diesel' | 'cng' | 'hybrid';

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
  | 'suv'
  | 'mid-size-suv'
  | 'full-size-suv'
  | 'muv'
  | 'minivan'
  | 'pickup'
  | 'coupe'
  | 'coupe-suv'
  | 'convertible';

/**
 * Per-fuel-type ICE benchmarks keyed by body type.
 * Missing fuel type entries fall back to ICE_BENCHMARKS (petrol defaults).
 */
export const ICE_FUEL_BENCHMARKS: Record<BenchmarkKey, Partial<Record<IceFuelType, BenchmarkThresholds>>> = {
  hatchback: {
    petrol: { weak_max: 16, average_max: 20, good_max: 24 },
    diesel: { weak_max: 18, average_max: 22, good_max: 26 },
    cng:    { weak_max: 24, average_max: 30, good_max: 34 },
    hybrid: { weak_max: 20, average_max: 25, good_max: 30 },
  },
  'compact-sedan': {
    petrol: { weak_max: 15, average_max: 19, good_max: 23 },
    diesel: { weak_max: 18, average_max: 22, good_max: 26 },
    cng:    { weak_max: 24, average_max: 30, good_max: 34 },
    hybrid: { weak_max: 20, average_max: 25, good_max: 30 },
  },
  sedan: {
    petrol: { weak_max: 14, average_max: 18, good_max: 22 },
    diesel: { weak_max: 17, average_max: 21, good_max: 25 },
    cng:    { weak_max: 22, average_max: 28, good_max: 32 },
    hybrid: { weak_max: 20, average_max: 25, good_max: 30 },
  },
  'compact-suv': {
    petrol: { weak_max: 12, average_max: 16, good_max: 20 },
    diesel: { weak_max: 15, average_max: 19, good_max: 23 },
    cng:    { weak_max: 22, average_max: 28, good_max: 32 },
    hybrid: { weak_max: 18, average_max: 24, good_max: 28 },
  },
  suv: {
    petrol: { weak_max: 11, average_max: 15, good_max: 19 },
    diesel: { weak_max: 13, average_max: 17, good_max: 21 },
    cng:    { weak_max: 20, average_max: 26, good_max: 30 },
    hybrid: { weak_max: 18, average_max: 24, good_max: 28 },
  },
  'mid-size-suv': {
    petrol: { weak_max: 10, average_max: 14, good_max: 18 },
    diesel: { weak_max: 12, average_max: 16, good_max: 20 },
    cng:    { weak_max: 16, average_max: 22, good_max: 26 },
    hybrid: { weak_max: 18, average_max: 24, good_max: 28 },
  },
  'full-size-suv': {
    petrol: { weak_max:  8, average_max: 12, good_max: 15 },
    diesel: { weak_max: 10, average_max: 14, good_max: 18 },
    hybrid: { weak_max: 14, average_max: 20, good_max: 25 },
  },
  muv: {
    petrol: { weak_max: 11, average_max: 15, good_max: 19 },
    diesel: { weak_max: 13, average_max: 17, good_max: 21 },
    cng:    { weak_max: 22, average_max: 28, good_max: 32 },
    hybrid: { weak_max: 18, average_max: 24, good_max: 28 },
  },
  minivan: {
    petrol: { weak_max: 10, average_max: 14, good_max: 18 },
    diesel: { weak_max: 12, average_max: 16, good_max: 20 },
    cng:    { weak_max: 22, average_max: 28, good_max: 32 },
    hybrid: { weak_max: 18, average_max: 24, good_max: 28 },
  },
  pickup: {
    diesel: { weak_max:  8, average_max: 12, good_max: 15 },
  },
  'coupe-suv': {
    petrol: { weak_max: 10, average_max: 14, good_max: 18 },
    diesel: { weak_max: 12, average_max: 16, good_max: 20 },
    hybrid: { weak_max: 18, average_max: 24, good_max: 28 },
  },
  coupe: {
    petrol: { weak_max:  8, average_max: 12, good_max: 16 },
    diesel: { weak_max: 10, average_max: 14, good_max: 18 },
    hybrid: { weak_max: 14, average_max: 20, good_max: 25 },
  },
  convertible: {
    petrol: { weak_max:  8, average_max: 12, good_max: 16 },
    hybrid: { weak_max: 14, average_max: 20, good_max: 25 },
  },
};

/**
 * ICE_BENCHMARKS is kept for backward compatibility (admin matrix display + legacy overrides).
 * It represents petrol defaults, falling back to diesel when petrol is absent.
 */
export const ICE_BENCHMARKS: Record<BenchmarkKey, BenchmarkThresholds> = {
  hatchback:       ICE_FUEL_BENCHMARKS.hatchback.petrol!,
  'compact-sedan': ICE_FUEL_BENCHMARKS['compact-sedan'].petrol!,
  sedan:           ICE_FUEL_BENCHMARKS.sedan.petrol!,
  'compact-suv':   ICE_FUEL_BENCHMARKS['compact-suv'].petrol!,
  suv:             ICE_FUEL_BENCHMARKS.suv.petrol!,
  'mid-size-suv':  ICE_FUEL_BENCHMARKS['mid-size-suv'].petrol!,
  'full-size-suv': ICE_FUEL_BENCHMARKS['full-size-suv'].petrol!,
  muv:             ICE_FUEL_BENCHMARKS.muv.petrol!,
  minivan:         ICE_FUEL_BENCHMARKS.minivan.petrol!,
  pickup:          ICE_FUEL_BENCHMARKS.pickup.diesel!,
  'coupe-suv':     ICE_FUEL_BENCHMARKS['coupe-suv'].petrol!,
  coupe:           ICE_FUEL_BENCHMARKS.coupe.petrol!,
  convertible:     ICE_FUEL_BENCHMARKS.convertible.petrol!,
};

export const EV_BENCHMARKS: Partial<Record<BenchmarkKey, BenchmarkThresholds>> = {
  hatchback:       { weak_max: 220, average_max: 320, good_max: 420 },
  'compact-sedan': { weak_max: 250, average_max: 380, good_max: 500 },
  sedan:           { weak_max: 300, average_max: 450, good_max: 550 },
  'compact-suv':   { weak_max: 280, average_max: 400, good_max: 550 },
  suv:             { weak_max: 300, average_max: 420, good_max: 580 },
  'mid-size-suv':  { weak_max: 350, average_max: 500, good_max: 600 },
  'full-size-suv': { weak_max: 400, average_max: 550, good_max: 650 },
  muv:             { weak_max: 280, average_max: 420, good_max: 550 },
  minivan:         { weak_max: 280, average_max: 420, good_max: 550 },
  pickup:          { weak_max: 350, average_max: 500, good_max: 600 },
  'coupe-suv':     { weak_max: 300, average_max: 450, good_max: 600 },
  convertible:     { weak_max: 300, average_max: 450, good_max: 600 },
};

/**
 * Body-type slugs vary across data sources, so we resolve via fuzzy keyword matching
 * rather than exact slug equality. Returns null if no reasonable mapping exists.
 */
export function resolveBenchmarkKey(bodyTypeSlugOrName: string | undefined | null): BenchmarkKey | null {
  if (!bodyTypeSlugOrName) return null;
  const s = bodyTypeSlugOrName.toLowerCase().replace(/[\s_]+/g, '-');

  // Coupe SUV must be checked before bare coupe and bare SUV
  if (s.includes('coupe') && s.includes('suv')) return 'coupe-suv';

  if (s.includes('convertible') || s.includes('cabriolet') || s.includes('roadster')) return 'convertible';
  if (s.includes('coupe')) return 'coupe';
  if (s.includes('pickup') || s.includes('truck')) return 'pickup';
  if (s.includes('minivan') || s.includes('van')) return 'minivan';

  // SUV variants — check before bare 'suv'
  const isSuv = s.includes('suv');
  if (isSuv) {
    if (s.includes('full') || s.includes('large')) return 'full-size-suv';
    if (s.includes('mid')) return 'mid-size-suv';
    if (s.includes('compact') || s.includes('sub')) return 'compact-suv';
    return 'suv';
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
