"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarIntelligenceLLMService = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const car_model_1 = require("../../models/car.model");
const car_aggregation_service_1 = require("./car-aggregation.service");
const platform_settings_service_1 = require("../../modules/settings/services/platform-settings.service");
const HAIKU_MODEL = 'claude-haiku-4-5';
// One persistent client. The SDK reads ANTHROPIC_API_KEY from env. If the key is
// missing, the call still throws on first request — we surface that as a
// service-level error rather than crashing at boot.
let cachedClient = null;
const getClient = () => {
    if (!cachedClient) {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY is not set. LLM refinement is disabled — set the env var in .env to enable it.');
        }
        cachedClient = new sdk_1.default();
    }
    return cachedClient;
};
// Rubric for each AI intelligence flag. Goes in the cached system prompt so we
// pay the cache-write premium once and read from cache on every subsequent car.
// Padded with deliberately verbose, stable wording so the prefix exceeds the
// 4096-token cache minimum for Haiku 4.5.
const RUBRIC = `You are a senior automotive product analyst for Carsalahakar, an Indian car-discovery platform.
You will receive an aggregated specification snapshot for a single car model (rolled up from its variants)
plus a deterministic-rule verdict for each of 8 buyer-intent intelligence flags. The deterministic rules
produced low confidence on some of those flags, which is why you are being consulted: review the spec
snapshot and decide, for each flag the user asks about, whether the rule verdict should stand or flip.

# How to decide each flag

The 8 flags drive SEO landing pages and AI recommendations (e.g. "best family cars under 15 lakh",
"city-friendly hatchbacks", "performance cars with adaptive cruise"). Your verdict must reflect what a
typical Indian buyer would expect from that label — not pure spec arithmetic. Use these definitions:

## family_friendly
A typical Indian family of 4-6 should be comfortable on long trips and feel the car is safe enough for
children. Strong positive signals: 6+ seating capacity, rear AC vents, ISOFIX child seat mounts, NCAP
rating 4+ stars, boot space >= 400L. Strong negative signals: 2-door coupe, hard ride, no rear AC,
NCAP rating below 3 stars. Note: a 5-seat SUV with strong safety scores still qualifies — seating
capacity alone is not the deciding factor.

## city_friendly
Easy to drive, park, and refuel in dense Indian urban traffic. Positive signals: hatchback/sedan body
type, length < 4200mm, ARAI mileage >= 18 kmpl, automatic transmission available, light steering, good
visibility, tight turning radius. Negative signals: large SUV/MPV body, length > 4600mm, mileage < 12
kmpl, manual-only with heavy clutch.

## highway_friendly
Comfortable and safe at sustained 100+ kmph speeds, with enough power to overtake heavy traffic.
Positive signals: max power >= 130 bhp, max torque >= 250 Nm, cruise control or adaptive cruise control,
6-speed gearbox or automatic, mileage >= 16 kmpl on highway, dual airbags+ and ABS+EBD as baseline.
Negative signals: max power < 90 bhp, no cruise control, manual 5-speed only, mileage < 14 kmpl on
highway.

## offroad_ready
Capable of tackling broken roads, mild trails, and water crossings — not full rock-crawling. Positive
signals: SUV or crossover body type, ground clearance >= 200mm, AWD/4WD drive type available, hill
descent control, terrain modes, skid plate. Negative signals: low ground clearance < 165mm, FWD only,
sedan/hatchback body, no terrain modes.

## feature_loaded
Has enough premium/convenience features to feel "loaded" by current Indian-market standards. Positive
signals: 8+ flagship features present across the variant lineup (sunroof, ventilated seats, automatic
climate control, cruise control, keyless entry, push-button start, wireless charging, Android Auto,
Apple CarPlay, 360-degree camera, LED headlamps, DRLs, heads-up display, connected car app, ambient
lighting). Negative signals: fewer than 5 flagship features even in the top variant.

## premium_cabin
Cabin materials, finish, and seat comfort feel premium — not just feature-rich. Positive signals:
ventilated seats, panoramic sunroof, leather-wrapped steering, ambient lighting, soft-touch dashboard,
premium cabin materials, memory seats, powered seats with electric adjustment, heads-up display.
Negative signals: hard plastics, fabric upholstery only, no ambient lighting, no soft-touch surfaces.

## budget_friendly
Affordable for a typical mid-income Indian family — ex-showroom in the entry/mid range, not the premium
tier. Positive signals: ex-showroom min < ₹8L, max < ₹15L, low EMI, fuel-efficient (mileage >= 18 kmpl)
for low running cost, low cost of ownership. Negative signals: min ex-showroom > ₹12L, max > ₹20L.

## performance_focused
Built for driving enthusiasts who want spirited acceleration and dynamic handling. Positive signals:
0-100 acceleration < 9 seconds, max power >= 200 bhp, max torque >= 350 Nm, sport drive modes, paddle
shifters, performance brakes, sport-tuned suspension, low kerb weight relative to power. Negative
signals: 0-100 > 14 seconds, max power < 120 bhp, no sport mode, automatic-only economy gearbox.

# Indian market context (always apply)

- NCAP ratings here mean Global NCAP or Bharat NCAP (BNCAP); both count toward family_friendly.
- ARAI mileage figures are claimed; real-world is typically 70-80%. Account for this when reasoning
  about city/highway-friendliness vs. claimed mileage.
- "Sunroof" in India is overwhelmingly a buyer-want feature; weight it heavier than its Western
  equivalent for feature_loaded and premium_cabin.
- ADAS is rapidly becoming a premium-segment expectation but is not yet a base-segment feature —
  presence of ADAS Level 2 features (lane keep, adaptive cruise, AEB) supports feature_loaded and
  premium_cabin, but absence is not strongly negative below ₹15L.
- "Connected car" features (app-based start/lock/locate) are now table-stakes for feature_loaded
  above ₹8L; below that they're a meaningful differentiator.
- Drive types: 4WD / AWD / 4x4 / e-AWD / dual-motor AWD all count toward offroad_ready. FWD / 2WD /
  4x2 / RWD do not.

# Decision rules

- If the spec snapshot contradicts the rule verdict clearly (e.g., rule says budget_friendly=true but
  min price is ₹14L), flip the verdict.
- If the rule verdict is plausible and the snapshot is consistent with it, confirm.
- If the snapshot is genuinely ambiguous (e.g., min price is ₹7.5L and max is ₹13L — borderline
  budget_friendly), use your best judgment based on what a typical Indian buyer would call the car.
- Your rationale must be one short sentence (<= 25 words) citing the specific evidence you weighted
  most. Examples: "5-star NCAP, ISOFIX, and 470L boot make it a clear family pick despite 5-seat
  layout." / "Min price ₹14L exceeds typical budget threshold even though feature-loaded."

You will call the \`set_flag_verdicts\` tool exactly once with your verdict for each requested flag.
Do not produce any free-form text outside the tool call.`;
// Tool schema for structured output. Each flag the caller asks about appears as
// an object with verdict (boolean) and rationale (one-line string). `strict: true`
// guarantees Claude returns a parameter object that matches this schema exactly.
const buildToolSchema = (flagsToReview) => {
    const properties = {};
    for (const flag of flagsToReview) {
        properties[flag] = {
            type: 'object',
            properties: {
                verdict: { type: 'boolean', description: `True if "${flag}" applies to this car, false otherwise.` },
                rationale: {
                    type: 'string',
                    description: `One sentence, max 25 words, citing the specific spec evidence you weighted.`,
                    maxLength: 200,
                },
            },
            required: ['verdict', 'rationale'],
            additionalProperties: false,
        };
    }
    return {
        name: 'set_flag_verdicts',
        description: 'Record your reviewed verdict and rationale for each requested AI intelligence flag.',
        strict: true,
        input_schema: {
            type: 'object',
            properties,
            required: flagsToReview,
            additionalProperties: false,
        },
    };
};
// Compact JSON-ish summary of the car's aggregated state — fed to the LLM. Stays
// small to keep the per-request user-message cost low.
const buildSpecSnapshot = (car, agg) => {
    const safe = (v) => (v === null || v === undefined ? '—' : v);
    return [
        `Car: ${car.name} (${car.slug})`,
        `Price (ex-showroom): ${agg.min_variant_price ? `₹${(agg.min_variant_price / 100000).toFixed(1)}L` : '—'} → ${agg.max_variant_price ? `₹${(agg.max_variant_price / 100000).toFixed(1)}L` : '—'}`,
        `Body types: ${Array.from(new Set(agg.engine_options.map(_ => '').filter(Boolean))).join(', ') || 'not specified'}`,
        `Fuel types: ${agg.aggregated_fuel_types.join(', ') || '—'}`,
        `Transmissions: ${agg.aggregated_transmission_types.join(', ') || '—'}`,
        `Drive types: ${agg.aggregated_drive_types.join(', ') || '—'}`,
        `Engine options: ${agg.engine_options.join(' | ') || '—'}`,
        `Battery options (kWh): ${agg.battery_options.join(', ') || '—'}`,
        `Power: ${safe(agg.power_min_bhp)}–${safe(agg.power_max_bhp)} bhp`,
        `Torque: ${safe(agg.torque_min_nm)}–${safe(agg.torque_max_nm)} Nm`,
        `Mileage: ${safe(agg.mileage_min_kmpl)}–${safe(agg.mileage_max_kmpl)} kmpl`,
        `Range (EV): ${safe(agg.range_min_km)}–${safe(agg.range_max_km)} km`,
        `Ground clearance: ${safe(agg.ground_clearance_mm)} mm`,
        `Boot space: ${safe(agg.boot_space_l)} L`,
        `Wheelbase: ${safe(agg.wheelbase_mm)} mm`,
        `Max seating: ${safe(agg.max_seating_capacity)}`,
        `Max airbags: ${safe(agg.max_airbags)}`,
        `NCAP rating: ${safe(agg.best_ncap_rating)}★ | BNCAP: ${safe(agg.best_bncap_rating)}★ | Global NCAP: ${safe(agg.best_global_ncap_rating)}★`,
        `ADAS level: ${safe(agg.best_adas_level)}`,
        `Feature availability: sunroof=${agg.sunroof_available}, panoramic=${agg.panoramic_sunroof_available}, ADAS=${agg.adas_available}, 360°cam=${agg.camera_360_available}, ventilated_seats=${agg.ventilated_seats_available}, wireless_charger=${agg.wireless_charger_available}, connected_car=${agg.connected_car_available}, air_purifier=${agg.air_purifier_available}`,
    ].join('\n');
};
class CarIntelligenceLLMService {
    /**
     * Refine ambiguous AI intelligence flags for a car using Claude Haiku 4.5.
     *
     * Flow:
     *   1. Recompute aggregates via CarAggregationService (so confidence scores are fresh).
     *   2. Identify flags with confidence < AMBIGUOUS_CONFIDENCE_THRESHOLD.
     *   3. If none, return early (no LLM call, no token spend).
     *   4. Build the LLM request: cached system rubric + user-message spec snapshot
     *      + forced tool_use on `set_flag_verdicts` (strict schema = guaranteed shape).
     *   5. Apply the LLM verdicts back to the Car document, recording rationale and
     *      adding each refined flag to `ai_intelligence_meta.refined_by_llm`.
     *
     * @returns null if no ambiguous flags found (no LLM call made), or the result.
     */
    static async refineAmbiguousFlags(carId) {
        // Read live AI settings — emergency kill, model selection, and confidence threshold.
        let dynamicModel = HAIKU_MODEL;
        let dynamicThreshold = car_aggregation_service_1.AMBIGUOUS_CONFIDENCE_THRESHOLD;
        try {
            const aiSettings = await platform_settings_service_1.PlatformSettingsService.getSettingsByGroup('ai_intelligence');
            if (aiSettings.emergency_ai_off === true) {
                throw new Error('AI refinement is disabled via emergency kill switch (Settings → AI Intelligence → Emergency AI Off).');
            }
            if (aiSettings.model)
                dynamicModel = aiSettings.model;
            if (typeof aiSettings.llm_confidence_threshold === 'number') {
                dynamicThreshold = aiSettings.llm_confidence_threshold / 100;
            }
        }
        catch (err) {
            if (err.message?.includes('emergency kill switch'))
                throw err;
            // Settings unavailable — fall back to compiled-in defaults.
        }
        const car = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false })
            .select('car_id name slug')
            .lean();
        if (!car) {
            throw new Error(`Car ${carId} not found`);
        }
        // Recompute so we get fresh confidence scores. This persists current rule
        // verdicts already (in case the caller skipped the explicit recompute).
        const agg = await car_aggregation_service_1.CarAggregationService.recomputeFullAggregates(carId);
        if (!agg) {
            throw new Error(`No variants to aggregate for car ${carId}`);
        }
        const ambiguous = car_aggregation_service_1.AI_FLAG_KEYS.filter(flag => (agg.ai_intelligence_meta.confidence_scores[flag] ?? 0) < dynamicThreshold);
        if (ambiguous.length === 0) {
            return null;
        }
        const client = getClient();
        const tool = buildToolSchema(ambiguous);
        const specSnapshot = buildSpecSnapshot(car, agg);
        const ruleVerdicts = ambiguous
            .map(f => `  - ${f}: rules say ${agg[f] ? 'YES' : 'NO'} (confidence ${(agg.ai_intelligence_meta.confidence_scores[f] ?? 0).toFixed(2)}; rationale: "${agg.ai_intelligence_meta.flag_rationale[f] ?? ''}")`)
            .join('\n');
        const response = await client.messages.create({
            model: dynamicModel,
            max_tokens: 2048,
            system: [
                {
                    type: 'text',
                    text: RUBRIC,
                    cache_control: { type: 'ephemeral' },
                },
            ],
            tools: [tool],
            tool_choice: { type: 'tool', name: 'set_flag_verdicts' },
            messages: [
                {
                    role: 'user',
                    content: `Review the following ${ambiguous.length} ambiguous flag(s) for this car. The deterministic rules produced low confidence; flip the verdict if the spec snapshot warrants it, otherwise confirm.

# Spec snapshot
${specSnapshot}

# Flags to review
${ruleVerdicts}

Call set_flag_verdicts once with your verdict for each of the ${ambiguous.length} flag(s) listed above.`,
                },
            ],
        });
        // Extract the tool_use block. With tool_choice forced to the tool above and
        // strict: true, the SDK guarantees this is present and matches the schema.
        const toolUseBlock = response.content.find(b => b.type === 'tool_use');
        if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
            throw new Error('LLM did not produce a tool_use response — refinement failed');
        }
        const verdicts = toolUseBlock.input;
        // Apply verdicts back to the car. Build the $set payload directly so we don't
        // need a round-trip through the aggregation service (which would overwrite
        // confidence_scores again from the still-current variant state).
        const setPayload = {};
        const flipped = [];
        const unchanged = [];
        const rationaleOut = {};
        const verdictsOut = {};
        for (const flag of ambiguous) {
            const result = verdicts[flag];
            if (!result)
                continue;
            const newVerdict = result.verdict;
            const oldVerdict = agg[flag];
            setPayload[flag] = newVerdict;
            setPayload[`ai_intelligence_meta.flag_rationale.${flag}`] = result.rationale;
            verdictsOut[flag] = newVerdict;
            rationaleOut[flag] = result.rationale;
            if (newVerdict !== oldVerdict)
                flipped.push(flag);
            else
                unchanged.push(flag);
        }
        setPayload['ai_intelligence_meta.refined_by_llm'] = ambiguous;
        setPayload['ai_intelligence_meta.last_refined_at'] = new Date();
        setPayload['ai_intelligence_meta.model_used'] = response.model;
        await car_model_1.Car.updateOne({ car_id: carId }, { $set: setPayload });
        return {
            car_id: carId,
            flags_reviewed: ambiguous,
            flags_unchanged: unchanged,
            flags_flipped: flipped,
            rationale: rationaleOut,
            verdicts: verdictsOut,
            model_used: response.model,
            input_tokens: response.usage.input_tokens,
            output_tokens: response.usage.output_tokens,
            cache_read_input_tokens: response.usage.cache_read_input_tokens ?? 0,
            cache_creation_input_tokens: response.usage.cache_creation_input_tokens ?? 0,
        };
    }
}
exports.CarIntelligenceLLMService = CarIntelligenceLLMService;
//# sourceMappingURL=car-intelligence-llm.service.js.map