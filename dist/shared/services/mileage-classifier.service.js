"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MileageClassifierService = void 0;
exports.parseMileageValue = parseMileageValue;
const mileage_benchmarks_1 = require("../../constants/mileage-benchmarks");
const body_type_model_1 = require("../../models/body-type.model");
const fuel_type_model_1 = require("../../models/fuel-type.model");
const mileage_benchmark_override_model_1 = require("../../models/mileage-benchmark-override.model");
const EMPTY_RESULT = {
    mileage_class: null,
    mileage_class_value: null,
    mileage_class_source: null,
    range_class: null,
    range_class_value: null,
    range_class_source: null,
};
/**
 * Parse a numeric value out of a mileage/range string like "22.5 km/l", "350 km", or "17.4".
 * Returns null when no positive number can be extracted.
 */
function parseMileageValue(input) {
    if (input == null)
        return null;
    if (typeof input === 'number')
        return Number.isFinite(input) && input > 0 ? input : null;
    if (typeof input !== 'string')
        return null;
    const match = input.match(/-?\d+(?:\.\d+)?/);
    if (!match)
        return null;
    const n = parseFloat(match[0]);
    return Number.isFinite(n) && n > 0 ? n : null;
}
let cache = null;
let cachePromise = null;
async function buildCache() {
    const [bodyTypes, fuelTypes, overrides] = await Promise.all([
        body_type_model_1.BodyType.find({}).select('body_type_id slug name').lean(),
        fuel_type_model_1.FuelType.find({}).select('fuel_type_id slug name').lean(),
        mileage_benchmark_override_model_1.MileageBenchmarkOverride.find({}).lean(),
    ]);
    const bodyTypeSlugById = new Map();
    for (const bt of bodyTypes) {
        bodyTypeSlugById.set(bt.body_type_id, bt.slug || bt.name || '');
    }
    const fuelCategoryById = new Map();
    const fuelTypeSlugById = new Map();
    for (const ft of fuelTypes) {
        const ident = (ft.slug || ft.name || '').toLowerCase();
        const isEv = ident === 'ev' || ident === 'bev' || ident.includes('electric');
        fuelCategoryById.set(ft.fuel_type_id, isEv ? 'ev' : 'ice');
        fuelTypeSlugById.set(ft.fuel_type_id, ident);
    }
    const overrideMap = new Map();
    for (const ov of overrides) {
        overrideMap.set(`${ov.body_type_id}:${ov.fuel_category}`, ov.thresholds);
    }
    return { bodyTypeSlugById, fuelCategoryById, fuelTypeSlugById, overrides: overrideMap };
}
async function getCache() {
    if (cache)
        return cache;
    if (!cachePromise) {
        cachePromise = buildCache().then(snapshot => {
            cache = snapshot;
            cachePromise = null;
            return snapshot;
        });
    }
    return cachePromise;
}
class MileageClassifierService {
    /**
     * Drop the in-memory cache. Call after editing overrides, fuel types, or body types.
     */
    static invalidateCache() {
        cache = null;
        cachePromise = null;
    }
    /**
     * Decide the fuel category for a variant. Logic:
     *   1. If the variant or its car points at an EV fuel type → 'ev'.
     *   2. Else if the variant has an electric_range / real_range / battery_wltp_km → 'ev'.
     *   3. Else 'ice' (hybrid and CNG both use the ICE table per spec).
     */
    static detectFuelCategory(variant, parentCar, fuelCategoryById) {
        if (variant.fuel_type_id && fuelCategoryById.get(variant.fuel_type_id) === 'ev')
            return 'ev';
        if (parentCar?.fuel_type_id && fuelCategoryById.get(parentCar.fuel_type_id) === 'ev')
            return 'ev';
        if (parentCar?.is_electric)
            return 'ev';
        const battery = variant.specs_normalized?.battery_charging;
        if (battery) {
            const hasEvSignal = parseMileageValue(battery.electric_range) != null ||
                parseMileageValue(battery.real_range) != null ||
                (battery.real_world_range != null && battery.real_world_range > 0) ||
                (battery.battery_wltp_km != null && battery.battery_wltp_km > 0);
            if (hasEvSignal)
                return 'ev';
        }
        return 'ice';
    }
    /**
     * Resolve the specific ICE fuel sub-type for granular benchmark lookup.
     * Falls back to 'petrol' when the fuel type is unknown or unmatched.
     */
    static detectIceFuelType(variant, fuelTypeSlugById) {
        if (!variant.fuel_type_id)
            return 'petrol';
        const slug = fuelTypeSlugById.get(variant.fuel_type_id) ?? '';
        if (slug.includes('diesel'))
            return 'diesel';
        if (slug.includes('cng') || slug.includes('compressed') || slug.includes('natural-gas'))
            return 'cng';
        if (slug.includes('hybrid') || slug.includes('mhev') || slug.includes('phev') || slug.includes('self-charging'))
            return 'hybrid';
        return 'petrol';
    }
    /**
     * Get the thresholds for a (body_type_id, fuel_category) pair. Precedence:
     *   1. Override row for this body_type_id + fuel_category
     *   2. Fuel-specific ICE constant (ICE_FUEL_BENCHMARKS[key][iceFuelType])
     *   3. Generic ICE constant (ICE_BENCHMARKS[key], petrol defaults)
     *   4. null if neither yields a match
     */
    static resolveThresholds(bodyTypeId, fuelCategory, snapshot, iceFuelType) {
        if (!bodyTypeId)
            return null;
        const override = snapshot.overrides.get(`${bodyTypeId}:${fuelCategory}`);
        if (override)
            return override;
        const slug = snapshot.bodyTypeSlugById.get(bodyTypeId);
        const key = (0, mileage_benchmarks_1.resolveBenchmarkKey)(slug);
        if (!key)
            return null;
        if (fuelCategory === 'ev')
            return mileage_benchmarks_1.EV_BENCHMARKS[key] ?? null;
        if (iceFuelType) {
            const specific = mileage_benchmarks_1.ICE_FUEL_BENCHMARKS[key]?.[iceFuelType];
            if (specific)
                return specific;
        }
        return mileage_benchmarks_1.ICE_BENCHMARKS[key] ?? null;
    }
    /**
     * Pick the strongest mileage signal available for an ICE/hybrid/CNG variant.
     * Preference order: ARAI > real > city > highway > CNG-specific.
     */
    static pickIceValue(variant) {
        const m = variant.specs_normalized?.mileage_range;
        if (!m)
            return null;
        const candidates = [
            { value: parseMileageValue(m.arai_mileage), source: 'arai' },
            { value: parseMileageValue(m.real_mileage), source: 'real' },
            { value: parseMileageValue(m.city_mileage), source: 'city' },
            { value: parseMileageValue(m.highway_mileage), source: 'highway' },
            { value: parseMileageValue(m.cng_mileage), source: 'cng' },
        ];
        for (const c of candidates) {
            if (c.value != null)
                return { value: c.value, source: c.source };
        }
        return null;
    }
    /**
     * Pick the strongest range signal for an EV variant.
     * Preference: electric_range > real_world_range > real_range > battery_wltp_km.
     */
    static pickEvValue(variant) {
        const b = variant.specs_normalized?.battery_charging;
        if (!b)
            return null;
        const candidates = [
            { value: parseMileageValue(b.electric_range), source: 'electric_range' },
            {
                value: b.real_world_range != null && b.real_world_range > 0 ? b.real_world_range : null,
                source: 'real_world_range',
            },
            { value: parseMileageValue(b.real_range), source: 'real_range' },
            {
                value: b.battery_wltp_km != null && b.battery_wltp_km > 0 ? b.battery_wltp_km : null,
                source: 'battery_wltp_km',
            },
        ];
        for (const c of candidates) {
            if (c.value != null)
                return { value: c.value, source: c.source };
        }
        return null;
    }
    /**
     * Compute the classification result for a single variant, given the parent car
     * (already-fetched, lean OK). Returns all four fields; null where data is missing.
     */
    static async classifyVariant(variant, parentCar) {
        if (!parentCar?.body_type_id)
            return { ...EMPTY_RESULT };
        const snapshot = await getCache();
        const fuelCategory = this.detectFuelCategory(variant, parentCar, snapshot.fuelCategoryById);
        const iceFuelType = fuelCategory === 'ice' ? this.detectIceFuelType(variant, snapshot.fuelTypeSlugById) : undefined;
        const thresholds = this.resolveThresholds(parentCar.body_type_id, fuelCategory, snapshot, iceFuelType);
        if (fuelCategory === 'ev') {
            const picked = this.pickEvValue(variant);
            if (!picked || !thresholds) {
                return { ...EMPTY_RESULT, range_class_value: picked?.value ?? null, range_class_source: picked?.source ?? null };
            }
            return {
                ...EMPTY_RESULT,
                range_class: (0, mileage_benchmarks_1.applyThresholds)(picked.value, thresholds),
                range_class_value: picked.value,
                range_class_source: picked.source,
            };
        }
        const picked = this.pickIceValue(variant);
        if (!picked || !thresholds) {
            return { ...EMPTY_RESULT, mileage_class_value: picked?.value ?? null, mileage_class_source: picked?.source ?? null };
        }
        return {
            ...EMPTY_RESULT,
            mileage_class: (0, mileage_benchmarks_1.applyThresholds)(picked.value, thresholds),
            mileage_class_value: picked.value,
            mileage_class_source: picked.source,
        };
    }
}
exports.MileageClassifierService = MileageClassifierService;
//# sourceMappingURL=mileage-classifier.service.js.map