"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EV_BENCHMARKS = exports.ICE_BENCHMARKS = exports.ICE_FUEL_BENCHMARKS = exports.MILEAGE_CLASS_ORDER = void 0;
exports.resolveBenchmarkKey = resolveBenchmarkKey;
exports.applyThresholds = applyThresholds;
exports.maxClass = maxClass;
exports.MILEAGE_CLASS_ORDER = {
    weak: 0,
    average: 1,
    good: 2,
    excellent: 3,
};
/**
 * Per-fuel-type ICE benchmarks keyed by body type.
 * Missing fuel type entries fall back to ICE_BENCHMARKS (petrol defaults).
 */
exports.ICE_FUEL_BENCHMARKS = {
    hatchback: {
        petrol: { weak_max: 16, average_max: 20, good_max: 24 },
        diesel: { weak_max: 18, average_max: 22, good_max: 26 },
        cng: { weak_max: 24, average_max: 30, good_max: 34 },
        hybrid: { weak_max: 20, average_max: 25, good_max: 30 },
    },
    'compact-sedan': {
        petrol: { weak_max: 15, average_max: 19, good_max: 23 },
        diesel: { weak_max: 18, average_max: 22, good_max: 26 },
        cng: { weak_max: 24, average_max: 30, good_max: 34 },
        hybrid: { weak_max: 20, average_max: 25, good_max: 30 },
    },
    sedan: {
        petrol: { weak_max: 14, average_max: 18, good_max: 22 },
        diesel: { weak_max: 17, average_max: 21, good_max: 25 },
        cng: { weak_max: 22, average_max: 28, good_max: 32 },
        hybrid: { weak_max: 20, average_max: 25, good_max: 30 },
    },
    'compact-suv': {
        petrol: { weak_max: 12, average_max: 16, good_max: 20 },
        diesel: { weak_max: 15, average_max: 19, good_max: 23 },
        cng: { weak_max: 22, average_max: 28, good_max: 32 },
        hybrid: { weak_max: 18, average_max: 24, good_max: 28 },
    },
    suv: {
        petrol: { weak_max: 11, average_max: 15, good_max: 19 },
        diesel: { weak_max: 13, average_max: 17, good_max: 21 },
        cng: { weak_max: 20, average_max: 26, good_max: 30 },
        hybrid: { weak_max: 18, average_max: 24, good_max: 28 },
    },
    'mid-size-suv': {
        petrol: { weak_max: 10, average_max: 14, good_max: 18 },
        diesel: { weak_max: 12, average_max: 16, good_max: 20 },
        cng: { weak_max: 16, average_max: 22, good_max: 26 },
        hybrid: { weak_max: 18, average_max: 24, good_max: 28 },
    },
    'full-size-suv': {
        petrol: { weak_max: 8, average_max: 12, good_max: 15 },
        diesel: { weak_max: 10, average_max: 14, good_max: 18 },
        hybrid: { weak_max: 14, average_max: 20, good_max: 25 },
    },
    muv: {
        petrol: { weak_max: 11, average_max: 15, good_max: 19 },
        diesel: { weak_max: 13, average_max: 17, good_max: 21 },
        cng: { weak_max: 22, average_max: 28, good_max: 32 },
        hybrid: { weak_max: 18, average_max: 24, good_max: 28 },
    },
    minivan: {
        petrol: { weak_max: 10, average_max: 14, good_max: 18 },
        diesel: { weak_max: 12, average_max: 16, good_max: 20 },
        cng: { weak_max: 22, average_max: 28, good_max: 32 },
        hybrid: { weak_max: 18, average_max: 24, good_max: 28 },
    },
    pickup: {
        diesel: { weak_max: 8, average_max: 12, good_max: 15 },
    },
    'coupe-suv': {
        petrol: { weak_max: 10, average_max: 14, good_max: 18 },
        diesel: { weak_max: 12, average_max: 16, good_max: 20 },
        hybrid: { weak_max: 18, average_max: 24, good_max: 28 },
    },
    coupe: {
        petrol: { weak_max: 8, average_max: 12, good_max: 16 },
        diesel: { weak_max: 10, average_max: 14, good_max: 18 },
        hybrid: { weak_max: 14, average_max: 20, good_max: 25 },
    },
    convertible: {
        petrol: { weak_max: 8, average_max: 12, good_max: 16 },
        hybrid: { weak_max: 14, average_max: 20, good_max: 25 },
    },
};
/**
 * ICE_BENCHMARKS is kept for backward compatibility (admin matrix display + legacy overrides).
 * It represents petrol defaults, falling back to diesel when petrol is absent.
 */
exports.ICE_BENCHMARKS = {
    hatchback: exports.ICE_FUEL_BENCHMARKS.hatchback.petrol,
    'compact-sedan': exports.ICE_FUEL_BENCHMARKS['compact-sedan'].petrol,
    sedan: exports.ICE_FUEL_BENCHMARKS.sedan.petrol,
    'compact-suv': exports.ICE_FUEL_BENCHMARKS['compact-suv'].petrol,
    suv: exports.ICE_FUEL_BENCHMARKS.suv.petrol,
    'mid-size-suv': exports.ICE_FUEL_BENCHMARKS['mid-size-suv'].petrol,
    'full-size-suv': exports.ICE_FUEL_BENCHMARKS['full-size-suv'].petrol,
    muv: exports.ICE_FUEL_BENCHMARKS.muv.petrol,
    minivan: exports.ICE_FUEL_BENCHMARKS.minivan.petrol,
    pickup: exports.ICE_FUEL_BENCHMARKS.pickup.diesel,
    'coupe-suv': exports.ICE_FUEL_BENCHMARKS['coupe-suv'].petrol,
    coupe: exports.ICE_FUEL_BENCHMARKS.coupe.petrol,
    convertible: exports.ICE_FUEL_BENCHMARKS.convertible.petrol,
};
exports.EV_BENCHMARKS = {
    hatchback: { weak_max: 220, average_max: 320, good_max: 420 },
    'compact-sedan': { weak_max: 250, average_max: 380, good_max: 500 },
    sedan: { weak_max: 300, average_max: 450, good_max: 550 },
    'compact-suv': { weak_max: 280, average_max: 400, good_max: 550 },
    suv: { weak_max: 300, average_max: 420, good_max: 580 },
    'mid-size-suv': { weak_max: 350, average_max: 500, good_max: 600 },
    'full-size-suv': { weak_max: 400, average_max: 550, good_max: 650 },
    muv: { weak_max: 280, average_max: 420, good_max: 550 },
    minivan: { weak_max: 280, average_max: 420, good_max: 550 },
    pickup: { weak_max: 350, average_max: 500, good_max: 600 },
    'coupe-suv': { weak_max: 300, average_max: 450, good_max: 600 },
    convertible: { weak_max: 300, average_max: 450, good_max: 600 },
};
/**
 * Body-type slugs vary across data sources, so we resolve via fuzzy keyword matching
 * rather than exact slug equality. Returns null if no reasonable mapping exists.
 */
function resolveBenchmarkKey(bodyTypeSlugOrName) {
    if (!bodyTypeSlugOrName)
        return null;
    const s = bodyTypeSlugOrName.toLowerCase().replace(/[\s_]+/g, '-');
    // Coupe SUV must be checked before bare coupe and bare SUV
    if (s.includes('coupe') && s.includes('suv'))
        return 'coupe-suv';
    if (s.includes('convertible') || s.includes('cabriolet') || s.includes('roadster'))
        return 'convertible';
    if (s.includes('coupe'))
        return 'coupe';
    if (s.includes('pickup') || s.includes('truck'))
        return 'pickup';
    if (s.includes('minivan') || s.includes('van'))
        return 'minivan';
    // SUV variants — check before bare 'suv'
    const isSuv = s.includes('suv');
    if (isSuv) {
        if (s.includes('full') || s.includes('large'))
            return 'full-size-suv';
        if (s.includes('mid'))
            return 'mid-size-suv';
        if (s.includes('compact') || s.includes('sub'))
            return 'compact-suv';
        return 'suv';
    }
    if (s.includes('muv') || s.includes('mpv') || s.includes('multi-purpose') || s.includes('people'))
        return 'muv';
    if (s.includes('hatchback') || s.includes('hatch'))
        return 'hatchback';
    if (s.includes('sedan')) {
        if (s.includes('compact') || s.includes('sub'))
            return 'compact-sedan';
        return 'sedan';
    }
    return null;
}
/**
 * Classify a numeric value against a threshold set. Returns null when value is
 * missing or non-finite.
 */
function applyThresholds(value, t) {
    if (value == null || !Number.isFinite(value))
        return null;
    if (value < t.weak_max)
        return 'weak';
    if (value < t.average_max)
        return 'average';
    if (value < t.good_max)
        return 'good';
    return 'excellent';
}
/**
 * Pick the higher of two classes by `MILEAGE_CLASS_ORDER`. Either side may be null.
 */
function maxClass(a, b) {
    if (!a)
        return b ?? null;
    if (!b)
        return a;
    return exports.MILEAGE_CLASS_ORDER[a] >= exports.MILEAGE_CLASS_ORDER[b] ? a : b;
}
