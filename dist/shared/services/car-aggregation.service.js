"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarAggregationService = exports.AMBIGUOUS_CONFIDENCE_THRESHOLD = exports.AI_FLAG_KEYS = void 0;
const car_variant_model_1 = require("../../models/car-variant.model");
const car_model_1 = require("../../models/car.model");
const fuel_type_model_1 = require("../../models/fuel-type.model");
const mileage_recompute_service_1 = require("./mileage-recompute.service");
// Numeric extraction from messy spec strings.
// "120 bhp @ 6000 rpm" → 120; "250 Nm" → 250; "200 mm" → 200; "8.5 sec" → 8.5.
// Returns null if no number found.
const extractNumber = (raw) => {
    if (raw == null)
        return null;
    if (typeof raw === 'number')
        return Number.isFinite(raw) ? raw : null;
    if (typeof raw !== 'string')
        return null;
    const m = raw.match(/-?\d+(?:\.\d+)?/);
    if (!m)
        return null;
    const n = Number(m[0]);
    return Number.isFinite(n) ? n : null;
};
const minNonNull = (a, b) => {
    if (a == null)
        return b;
    if (b == null)
        return a;
    return Math.min(a, b);
};
const maxNonNull = (a, b) => {
    if (a == null)
        return b;
    if (b == null)
        return a;
    return Math.max(a, b);
};
const fuelDisplayLabel = (name, slug) => {
    const key = (slug || name || '').toLowerCase();
    if (key === 'electric' || key === 'ev' || key === 'bev')
        return 'EV';
    return name || slug || '';
};
// Buyer-facing transmission labels — same vocabulary the variant schema enforces.
const TRANSMISSION_LABEL = {
    manual: 'Manual',
    automatic: 'Automatic',
    amt: 'AMT',
    cvt: 'CVT',
    dct: 'DCT',
    dsg: 'DSG',
    imt: 'iMT',
    torque_converter: 'Torque Converter',
    single_speed_ev: 'Single-Speed',
    e_cvt: 'e-CVT',
};
// Drive label normalization. Inputs vary wildly across importers; map them to a
// short stable set for SEO landing pages.
const DRIVE_LABEL = {
    fwd: 'FWD',
    '2wd': 'FWD',
    '4x2': 'FWD',
    rwd: 'RWD',
    awd: 'AWD',
    '4wd': 'AWD',
    '4x4': 'AWD',
    e_awd: 'eAWD',
    i_awd: 'iAWD',
    dual_motor_awd: 'Dual-Motor AWD',
};
const normalizeDriveLabel = (raw) => {
    if (!raw)
        return null;
    const key = String(raw).toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
    return DRIVE_LABEL[key] || raw;
};
exports.AI_FLAG_KEYS = [
    'family_friendly',
    'city_friendly',
    'highway_friendly',
    'offroad_ready',
    'feature_loaded',
    'premium_cabin',
    'budget_friendly',
    'performance_focused',
];
// Threshold below which a flag is "ambiguous" and eligible for LLM refinement.
// Tune empirically — start at 0.5 (anything within 0.25 of the decision boundary).
exports.AMBIGUOUS_CONFIDENCE_THRESHOLD = 0.5;
// Helper: turn a signal count into (verdict, confidence). Verdict is true iff
// signals_fired >= threshold. Confidence is the normalized distance from the
// decision boundary; ranges 0..1.
function scoreSignals(fired, total, threshold) {
    if (total <= 0)
        return { verdict: false, confidence: 0 };
    // Distance from threshold, normalized by the larger of "room above" and "room below"
    // so a flag with 3 signals and threshold 1 still hits confidence=1 when 0 fire.
    const verdict = fired >= threshold;
    const distance = verdict ? fired - threshold + 1 : threshold - fired;
    const range = verdict ? total - threshold + 1 : threshold;
    const confidence = Math.max(0, Math.min(1, distance / Math.max(range, 1)));
    return { verdict, confidence };
}
class CarAggregationService {
    /**
     * Compute the full aggregate snapshot for a car from its non-deleted,
     * non-archived variants. Pure: no DB writes. Returns null if the car
     * doesn't exist. Callers persist via `applyAggregates`.
     */
    static async computeAggregates(carId) {
        const car = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false }).select('car_id').lean();
        if (!car)
            return null;
        const variants = await car_variant_model_1.CarVariant.find({
            car_id: carId,
            is_deleted: false,
            is_archived: false,
        }).lean();
        return this.computeAggregatesFromVariants(variants);
    }
    /**
     * Compute aggregates from an already-loaded variant array. Exposed so the
     * import pipeline can aggregate without an extra round-trip.
     */
    static computeAggregatesFromVariants(variants) {
        const agg = {
            variant_count: variants.length,
            incomplete_variant_count: 0,
            min_variant_price: null,
            max_variant_price: null,
            min_on_road_price: null,
            max_on_road_price: null,
            min_emi: null,
            max_emi: null,
            aggregated_fuel_types: [],
            aggregated_transmission_types: [],
            aggregated_drive_types: [],
            engine_options: [],
            battery_options: [],
            power_min_bhp: null,
            power_max_bhp: null,
            torque_min_nm: null,
            torque_max_nm: null,
            mileage_min_kmpl: null,
            mileage_max_kmpl: null,
            range_min_km: null,
            range_max_km: null,
            ground_clearance_mm: null,
            boot_space_l: null,
            wheelbase_mm: null,
            max_seating_capacity: null,
            sunroof_available: false,
            panoramic_sunroof_available: false,
            adas_available: false,
            ventilated_seats_available: false,
            camera_360_available: false,
            connected_car_available: false,
            wireless_charger_available: false,
            air_purifier_available: false,
            max_airbags: null,
            best_ncap_rating: null,
            best_bncap_rating: null,
            best_global_ncap_rating: null,
            best_adas_level: null,
            family_friendly: false,
            city_friendly: false,
            highway_friendly: false,
            offroad_ready: false,
            feature_loaded: false,
            premium_cabin: false,
            budget_friendly: false,
            performance_focused: false,
            ai_intelligence_meta: {
                confidence_scores: {},
                flag_rationale: {},
                refined_by_llm: [],
                last_refined_at: null,
                model_used: null,
            },
        };
        const transmissionSet = new Set();
        const driveSet = new Set();
        const engineSet = new Set();
        const batterySet = new Set();
        const fuelIdSet = new Set();
        let totalAdasCount = 0;
        let totalFeatureCount = 0;
        let totalLuxCount = 0;
        let totalCabinPracticality = 0;
        let hasSuv = false;
        for (const v of variants) {
            // Effective on-the-lot price: ex_showroom_price (launched) or expected_price (upcoming).
            const exShowroom = typeof v.ex_showroom_price === 'number' && v.ex_showroom_price > 0
                ? v.ex_showroom_price
                : typeof v.expected_price === 'number' && v.expected_price > 0
                    ? v.expected_price
                    : null;
            if (exShowroom != null) {
                agg.min_variant_price = minNonNull(agg.min_variant_price, exShowroom);
                agg.max_variant_price = maxNonNull(agg.max_variant_price, exShowroom);
            }
            if (typeof v.on_road_price === 'number' && v.on_road_price > 0) {
                agg.min_on_road_price = minNonNull(agg.min_on_road_price, v.on_road_price);
                agg.max_on_road_price = maxNonNull(agg.max_on_road_price, v.on_road_price);
            }
            if (typeof v.emi_estimate === 'number' && v.emi_estimate > 0) {
                agg.min_emi = minNonNull(agg.min_emi, v.emi_estimate);
                agg.max_emi = maxNonNull(agg.max_emi, v.emi_estimate);
            }
            const hasPrice = exShowroom != null;
            const hasTransmission = typeof v.transmission_type === 'string' && v.transmission_type.length > 0;
            const hasFuel = typeof v.fuel_type_id === 'string' && v.fuel_type_id.length > 0;
            if (!hasPrice || !hasTransmission || !hasFuel) {
                agg.incomplete_variant_count++;
            }
            if (v.fuel_type_id)
                fuelIdSet.add(v.fuel_type_id);
            if (v.transmission_type) {
                const label = TRANSMISSION_LABEL[v.transmission_type] || v.transmission_type;
                transmissionSet.add(label);
            }
            if (v.drivetrain) {
                const label = normalizeDriveLabel(v.drivetrain);
                if (label)
                    driveSet.add(label);
            }
            const specs = v.specs_normalized ?? {};
            const engine = specs.engine_performance ?? {};
            const battery = specs.battery_charging ?? {};
            const mileage = specs.mileage_range ?? {};
            const dims = specs.dimensions_practicality ?? {};
            const safety = specs.safety ?? {};
            const adas = specs.adas ?? {};
            const comfort = specs.comfort_convenience ?? {};
            const infotainment = specs.infotainment_connectivity ?? {};
            const connected = specs.connected_car ?? {};
            const interior = specs.interior ?? {};
            const exterior = specs.exterior ?? {};
            const driverDisplay = specs.driver_display_controls ?? {};
            const storage = specs.storage_cabin_practicality ?? {};
            // Engine signature for SEO landing pages
            if (engine.displacement || engine.max_power) {
                const fuelKey = v.fuel_type_id ? '' : '';
                const parts = [engine.displacement, fuelKey, engine.max_power].filter(Boolean);
                if (parts.length > 0)
                    engineSet.add(parts.join(' ').trim());
            }
            // Battery capacities
            const batteryKwh = typeof battery.battery_capacity_kwh === 'number'
                ? battery.battery_capacity_kwh
                : extractNumber(battery.battery_capacity);
            if (batteryKwh != null && batteryKwh > 0)
                batterySet.add(batteryKwh);
            // Performance
            const powerBhp = extractNumber(engine.max_power);
            if (powerBhp != null) {
                agg.power_min_bhp = minNonNull(agg.power_min_bhp, powerBhp);
                agg.power_max_bhp = maxNonNull(agg.power_max_bhp, powerBhp);
            }
            const torqueNm = extractNumber(engine.max_torque);
            if (torqueNm != null) {
                agg.torque_min_nm = minNonNull(agg.torque_min_nm, torqueNm);
                agg.torque_max_nm = maxNonNull(agg.torque_max_nm, torqueNm);
            }
            // Mileage: prefer variant.mileage_class_value (already classified), fall back to specs.
            const mileageValue = typeof v.mileage_class_value === 'number'
                ? v.mileage_class_value
                : extractNumber(mileage.arai_mileage) ?? extractNumber(mileage.real_mileage);
            if (mileageValue != null) {
                agg.mileage_min_kmpl = minNonNull(agg.mileage_min_kmpl, mileageValue);
                agg.mileage_max_kmpl = maxNonNull(agg.mileage_max_kmpl, mileageValue);
            }
            // Range (EVs)
            const rangeValue = typeof v.range_class_value === 'number'
                ? v.range_class_value
                : extractNumber(battery.electric_range) ?? battery.real_world_range ?? battery.battery_wltp_km ?? null;
            if (rangeValue != null) {
                agg.range_min_km = minNonNull(agg.range_min_km, rangeValue);
                agg.range_max_km = maxNonNull(agg.range_max_km, rangeValue);
            }
            // Dimensions — these are usually uniform across variants. Take max so a
            // single accessible value wins over nulls.
            const gc = extractNumber(dims.ground_clearance);
            if (gc != null)
                agg.ground_clearance_mm = maxNonNull(agg.ground_clearance_mm, gc);
            const bs = extractNumber(dims.boot_space);
            if (bs != null)
                agg.boot_space_l = maxNonNull(agg.boot_space_l, bs);
            const wb = extractNumber(dims.wheelbase);
            if (wb != null)
                agg.wheelbase_mm = maxNonNull(agg.wheelbase_mm, wb);
            const seating = typeof dims.seating_capacity === 'number'
                ? dims.seating_capacity
                : typeof v.seating_capacity === 'number'
                    ? v.seating_capacity
                    : null;
            if (seating != null) {
                agg.max_seating_capacity = maxNonNull(agg.max_seating_capacity, seating);
            }
            // Feature availability — OR across variants
            if (interior.sunroof || interior.panoramic_sunroof || interior.moonroof) {
                agg.sunroof_available = true;
            }
            if (interior.panoramic_sunroof)
                agg.panoramic_sunroof_available = true;
            const adasFlags = [
                adas.adaptive_cruise_control,
                adas.lane_keep_assist,
                adas.lane_departure_warning,
                adas.blind_spot_monitoring,
                adas.forward_collision_warning,
                adas.automatic_emergency_braking,
                adas.traffic_sign_recognition,
                adas.autonomous_emergency_braking,
                adas.rear_cross_traffic_alert,
                adas.driver_attention_warning,
                adas.adaptive_high_beam_assist,
                adas.safe_exit_warning,
            ].filter(Boolean).length;
            if (adasFlags > 0)
                agg.adas_available = true;
            totalAdasCount = Math.max(totalAdasCount, adasFlags);
            if (comfort.ventilated_seats)
                agg.ventilated_seats_available = true;
            if (safety.camera_360)
                agg.camera_360_available = true;
            if (connected.app_connectivity ||
                connected.vehicle_tracking ||
                connected.remote_vehicle_control ||
                connected.find_my_car ||
                connected.remote_engine_start_stop ||
                connected.connected_car_tech) {
                agg.connected_car_available = true;
            }
            if (infotainment.wireless_charging)
                agg.wireless_charger_available = true;
            if (comfort.air_quality_control)
                agg.air_purifier_available = true;
            // Safety aggregates
            if (typeof safety.airbags === 'number') {
                agg.max_airbags = maxNonNull(agg.max_airbags, safety.airbags);
            }
            if (typeof safety.ncap_rating === 'number') {
                agg.best_ncap_rating = maxNonNull(agg.best_ncap_rating, safety.ncap_rating);
            }
            if (typeof safety.bncap_rating === 'number') {
                agg.best_bncap_rating = maxNonNull(agg.best_bncap_rating, safety.bncap_rating);
            }
            if (typeof safety.global_ncap_rating === 'number') {
                agg.best_global_ncap_rating = maxNonNull(agg.best_global_ncap_rating, safety.global_ncap_rating);
            }
            if (typeof safety.adas_level === 'number') {
                agg.best_adas_level = maxNonNull(agg.best_adas_level, safety.adas_level);
            }
            // Inputs for AI intelligence rules
            const featureFlags = [
                interior.sunroof,
                interior.panoramic_sunroof,
                comfort.ventilated_seats,
                comfort.automatic_climate_control,
                comfort.cruise_control,
                comfort.keyless_entry,
                comfort.push_button_start,
                infotainment.wireless_charging,
                infotainment.android_auto,
                infotainment.apple_carplay,
                safety.camera_360,
                exterior.led_headlights,
                exterior.drl,
                driverDisplay.heads_up_display,
                connected.app_connectivity,
            ].filter(Boolean).length;
            totalFeatureCount = Math.max(totalFeatureCount, featureFlags);
            const luxFlags = [
                comfort.ventilated_seats,
                interior.panoramic_sunroof,
                interior.leather_wrapped_steering,
                interior.ambient_lighting,
                interior.soft_touch_dashboard,
                interior.premium_cabin_materials,
                comfort.memory_seats,
                comfort.electric_adjustable_seats,
                driverDisplay.heads_up_display,
            ].filter(Boolean).length;
            totalLuxCount = Math.max(totalLuxCount, luxFlags);
            const cabinCount = [
                storage.cooled_glovebox,
                storage.rear_armrest,
                storage.driver_armrest_storage,
                comfort.rear_ac_vents,
            ].filter(Boolean).length;
            totalCabinPracticality = Math.max(totalCabinPracticality, cabinCount);
            const bodyType = (v.body_type || '').toLowerCase();
            if (bodyType.includes('suv') || bodyType.includes('crossover'))
                hasSuv = true;
        }
        // Resolve fuel-type IDs → display labels (with "EV" mapping).
        // Lazy-loaded inside applyAggregates to avoid a DB call when the caller already
        // has labels. We do it here too because the spec wants this field in computeAggregates.
        agg.aggregated_transmission_types = Array.from(transmissionSet).sort();
        agg.aggregated_drive_types = Array.from(driveSet).sort();
        agg.engine_options = Array.from(engineSet).sort();
        agg.battery_options = Array.from(batterySet).sort((a, b) => a - b);
        // ── AI intelligence rules — emit (verdict, confidence, rationale) per flag ──
        // Each rule counts signals fired vs total signals, then scoreSignals() converts
        // to a confidence score. Below AMBIGUOUS_CONFIDENCE_THRESHOLD → eligible for
        // LLM refinement via CarIntelligenceLLMService.
        const confidence_scores = {};
        const flag_rationale = {};
        // family_friendly: 3 signals (6+ seats, rear-AC+ISOFIX+NCAP>=4, decent boot)
        const familySignals = [
            { hit: (agg.max_seating_capacity ?? 0) >= 6, why: `${agg.max_seating_capacity ?? 0}-seater` },
            {
                hit: variants.some(v => v.specs_normalized?.comfort_convenience?.rear_ac_vents) &&
                    variants.some(v => v.specs_normalized?.safety?.isofix) &&
                    (agg.best_ncap_rating ?? 0) >= 4,
                why: `rear AC + ISOFIX + ${agg.best_ncap_rating ?? '?'}★ NCAP`,
            },
            { hit: (agg.boot_space_l ?? 0) >= 400, why: `${agg.boot_space_l ?? 0}L boot` },
        ];
        const familyFired = familySignals.filter(s => s.hit).length;
        const familyResult = scoreSignals(familyFired, familySignals.length, 1);
        agg.family_friendly = familyResult.verdict;
        confidence_scores.family_friendly = familyResult.confidence;
        flag_rationale.family_friendly = familySignals.filter(s => s.hit).map(s => s.why).join('; ') ||
            'no family signals fired';
        // city_friendly: 3 signals (hatch/sedan body, length<4200, mileage>=18)
        const allBodyTypes = new Set(variants.map(v => (v.body_type || '').toLowerCase()));
        const hasCompactBody = Array.from(allBodyTypes).some(bt => bt.includes('hatch') || bt.includes('sedan'));
        const lengthMax = variants.reduce((acc, v) => {
            const len = extractNumber(v.specs_normalized?.dimensions_practicality?.length);
            return len != null ? maxNonNull(acc, len) : acc;
        }, null);
        const citySignals = [
            { hit: hasCompactBody, why: 'compact body type' },
            { hit: lengthMax != null && lengthMax < 4200, why: `length ${lengthMax}mm` },
            { hit: (agg.mileage_max_kmpl ?? 0) >= 18, why: `${agg.mileage_max_kmpl ?? '?'} kmpl mileage` },
        ];
        const cityFired = citySignals.filter(s => s.hit).length;
        const cityResult = scoreSignals(cityFired, citySignals.length, 1);
        agg.city_friendly = cityResult.verdict;
        confidence_scores.city_friendly = cityResult.confidence;
        flag_rationale.city_friendly = citySignals.filter(s => s.hit).map(s => s.why).join('; ') ||
            'no city signals fired';
        // highway_friendly: 3 signals (power>=130, torque>=250, top_speed exists)
        const highwaySignals = [
            { hit: (agg.power_max_bhp ?? 0) >= 130, why: `${agg.power_max_bhp ?? 0} bhp max power` },
            { hit: (agg.torque_max_nm ?? 0) >= 250, why: `${agg.torque_max_nm ?? 0} Nm max torque` },
            { hit: (agg.mileage_max_kmpl ?? 0) >= 16, why: `${agg.mileage_max_kmpl ?? '?'} kmpl highway-friendly mileage` },
        ];
        const highwayFired = highwaySignals.filter(s => s.hit).length;
        const highwayResult = scoreSignals(highwayFired, highwaySignals.length, 2);
        agg.highway_friendly = highwayResult.verdict;
        confidence_scores.highway_friendly = highwayResult.confidence;
        flag_rationale.highway_friendly = highwaySignals.filter(s => s.hit).map(s => s.why).join('; ') ||
            'no highway signals fired';
        // offroad_ready: 3 signals (SUV body, ground_clearance>=200, AWD/4WD)
        const hasAwd = agg.aggregated_drive_types.some(d => d === 'AWD' || d === '4WD');
        const offroadSignals = [
            { hit: hasSuv, why: 'SUV/crossover body' },
            { hit: (agg.ground_clearance_mm ?? 0) >= 200, why: `${agg.ground_clearance_mm ?? 0}mm ground clearance` },
            { hit: hasAwd, why: 'AWD/4WD available' },
        ];
        const offroadFired = offroadSignals.filter(s => s.hit).length;
        const offroadResult = scoreSignals(offroadFired, offroadSignals.length, 2);
        agg.offroad_ready = offroadResult.verdict;
        confidence_scores.offroad_ready = offroadResult.confidence;
        flag_rationale.offroad_ready = offroadSignals.filter(s => s.hit).map(s => s.why).join('; ') ||
            'no offroad signals fired';
        // feature_loaded: count of flagship features fired (out of 15)
        const featureMax = 15;
        const featureResult = scoreSignals(totalFeatureCount, featureMax, 8);
        agg.feature_loaded = featureResult.verdict;
        confidence_scores.feature_loaded = featureResult.confidence;
        flag_rationale.feature_loaded = `${totalFeatureCount}/${featureMax} flagship features present`;
        // premium_cabin: count of luxury signals fired (out of 9)
        const luxMax = 9;
        const luxResult = scoreSignals(totalLuxCount, luxMax, 4);
        agg.premium_cabin = luxResult.verdict;
        confidence_scores.premium_cabin = luxResult.confidence;
        flag_rationale.premium_cabin = `${totalLuxCount}/${luxMax} premium-cabin signals`;
        // budget_friendly: single signal (price < 8L). High confidence either way —
        // a clear price band is unambiguous unless variants span the threshold.
        const minP = agg.min_variant_price ?? null;
        const maxP = agg.max_variant_price ?? null;
        const budgetSignals = [
            { hit: minP != null && minP < 800000, why: minP != null ? `min ₹${(minP / 100000).toFixed(1)}L` : '' },
            { hit: maxP != null && maxP < 1500000, why: maxP != null ? `max ₹${(maxP / 100000).toFixed(1)}L` : '' },
        ];
        const budgetFired = budgetSignals.filter(s => s.hit).length;
        const budgetResult = scoreSignals(budgetFired, budgetSignals.length, 1);
        agg.budget_friendly = budgetResult.verdict;
        confidence_scores.budget_friendly = budgetResult.confidence;
        flag_rationale.budget_friendly = budgetSignals.filter(s => s.hit).map(s => s.why).join('; ') ||
            'priced above budget threshold';
        // performance_focused: 3 signals (0-100<9s, power>=200, torque>=350)
        const fastest = variants.reduce((acc, v) => {
            const t = extractNumber(v.specs_normalized?.engine_performance?.acceleration_0_100);
            return t != null ? minNonNull(acc, t) : acc;
        }, null);
        const perfSignals = [
            { hit: fastest != null && fastest < 9, why: fastest != null ? `0-100 in ${fastest}s` : '' },
            { hit: (agg.power_max_bhp ?? 0) >= 200, why: `${agg.power_max_bhp ?? 0} bhp` },
            { hit: (agg.torque_max_nm ?? 0) >= 350, why: `${agg.torque_max_nm ?? 0} Nm` },
        ];
        const perfFired = perfSignals.filter(s => s.hit).length;
        const perfResult = scoreSignals(perfFired, perfSignals.length, 1);
        agg.performance_focused = perfResult.verdict;
        confidence_scores.performance_focused = perfResult.confidence;
        flag_rationale.performance_focused = perfSignals.filter(s => s.hit).map(s => s.why).join('; ') ||
            'no performance signals fired';
        agg.ai_intelligence_meta = {
            confidence_scores,
            flag_rationale,
            refined_by_llm: [],
            last_refined_at: null,
            model_used: null,
        };
        // Note: fuel-type labels are resolved in `applyAggregates` (needs DB lookup).
        // The set of IDs is stashed on a private symbol for that step.
        agg.__fuelIds = Array.from(fuelIdSet);
        return agg;
    }
    /**
     * Persist aggregates onto the Car document. Resolves fuel-type labels here so
     * the pure compute function stays sync.
     *
     * Preserves prior LLM refinements: if a flag was previously refined by Claude
     * and its rule confidence is STILL below the ambiguity threshold, we keep the
     * LLM verdict + rationale. If rule confidence has risen above the threshold,
     * we let the rules win and drop the LLM trail for that flag.
     */
    static async applyAggregates(carId, agg) {
        const fuelIds = agg.__fuelIds ?? [];
        let aggregated_fuel_types = [];
        if (fuelIds.length > 0) {
            const fuelDocs = await fuel_type_model_1.FuelType.find({ fuel_type_id: { $in: fuelIds }, is_deleted: false })
                .select('fuel_type_id name slug')
                .lean();
            const labelSet = new Set();
            for (const f of fuelDocs) {
                const label = fuelDisplayLabel(f.name, f.slug);
                if (label)
                    labelSet.add(label);
            }
            aggregated_fuel_types = Array.from(labelSet).sort();
        }
        // Load the prior LLM-refined trail so we can preserve refinements where the
        // rules pass is still ambiguous.
        const prior = await car_model_1.Car.findOne({ car_id: carId })
            .select('ai_intelligence_meta')
            .lean();
        const priorMeta = prior?.ai_intelligence_meta;
        if (priorMeta?.refined_by_llm && priorMeta.refined_by_llm.length > 0) {
            const stillAmbiguous = [];
            for (const flag of priorMeta.refined_by_llm) {
                const ruleConfidence = agg.ai_intelligence_meta.confidence_scores[flag] ?? 0;
                if (ruleConfidence < exports.AMBIGUOUS_CONFIDENCE_THRESHOLD) {
                    // LLM verdict still load-bearing — restore it.
                    const llmVerdict = priorMeta[flag];
                    if (typeof llmVerdict === 'boolean') {
                        agg[flag] = llmVerdict;
                    }
                    const llmRationale = priorMeta.flag_rationale?.[flag];
                    if (llmRationale) {
                        agg.ai_intelligence_meta.flag_rationale[flag] = llmRationale;
                    }
                    stillAmbiguous.push(flag);
                }
                // Otherwise the rules pass is now confident → drop the LLM trail for this flag.
            }
            agg.ai_intelligence_meta.refined_by_llm = stillAmbiguous;
            agg.ai_intelligence_meta.last_refined_at = priorMeta.last_refined_at ?? null;
            agg.ai_intelligence_meta.model_used = priorMeta.model_used ?? null;
        }
        // Strip the private __fuelIds tag before writing.
        const writable = { ...agg };
        delete writable.__fuelIds;
        await car_model_1.Car.updateOne({ car_id: carId }, { $set: { ...writable, aggregated_fuel_types } });
    }
    /**
     * One-shot recompute: read variants, compute, write back. The single
     * entry point that variant CRUD / import / admin endpoints should call.
     * Returns the aggregates that were written (or null if the car doesn't exist).
     */
    static async recomputeFullAggregates(carId) {
        const aggregates = await this.computeAggregates(carId);
        if (!aggregates)
            return null;
        await this.applyAggregates(carId, aggregates);
        // Keep the legacy mileage-only fields in sync (best_mileage_class etc.) —
        // those live outside the CarAggregates surface but other code reads them.
        await mileage_recompute_service_1.MileageRecomputeService.recomputeCarAggregatesOnly(carId);
        return aggregates;
    }
}
exports.CarAggregationService = CarAggregationService;
