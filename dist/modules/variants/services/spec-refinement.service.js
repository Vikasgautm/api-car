"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecRefinementService = void 0;
const car_variant_model_1 = require("../../../models/car-variant.model");
const car_model_1 = require("../../../models/car.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const variant_validation_service_1 = require("./variant-validation.service");
const cerebras_cloud_sdk_1 = __importDefault(require("@cerebras/cerebras_cloud_sdk"));
const MISSING_FIELD_REGISTRY = {
    // Top-level required fields
    variant_name: { label: 'Variant Name', location: 'top', type: 'string' },
    // NOTE: fuel_type_id is a relational UUID the admin must pick — not AI-fillable, so it is intentionally excluded.
    transmission_type: { label: 'Transmission', location: 'top', type: 'string', hint: 'one of: manual, automatic, amt, cvt, dct, torque_converter' },
    seating_capacity: { label: 'Seating Capacity', location: 'top', type: 'number', unit: 'seats' },
    ex_showroom_price: { label: 'Ex-Showroom Price', location: 'top', type: 'number', unit: 'INR (full rupee value, e.g. 1200000)' },
    expected_price: { label: 'Expected Price', location: 'top', type: 'number', unit: 'INR (full rupee value)' },
    model_year: { label: 'Model Year', location: 'top', type: 'number' },
    // Critical spec fields (nested in specs_normalized). Stored as free text in the
    // schema (values often carry units/rpm, e.g. "118 bhp @ 6700 rpm"), so type=string.
    engine_displacement: { label: 'Engine Displacement', location: 'spec', path: 'engine_performance.displacement', type: 'string', unit: 'cc' },
    power_bhp: { label: 'Max Power', location: 'spec', path: 'engine_performance.max_power', type: 'string', unit: 'bhp (may include @rpm)' },
    torque_nm: { label: 'Max Torque', location: 'spec', path: 'engine_performance.max_torque', type: 'string', unit: 'Nm (may include @rpm)' },
    fuel_tank_capacity: { label: 'Fuel Tank Capacity', location: 'spec', path: 'mileage_range.fuel_tank_capacity', type: 'string', unit: 'litres' },
    boot_space: { label: 'Boot Space', location: 'spec', path: 'dimensions_practicality.boot_space', type: 'string', unit: 'litres' },
    ground_clearance: { label: 'Ground Clearance', location: 'spec', path: 'dimensions_practicality.ground_clearance', type: 'string', unit: 'mm' },
    arai_mileage: { label: 'ARAI Mileage', location: 'spec', path: 'mileage_range.arai_mileage', type: 'string', unit: 'kmpl' },
    acceleration_0_100: { label: '0-100 km/h', location: 'spec', path: 'engine_performance.acceleration_0_100', type: 'string', unit: 'seconds' },
    top_speed: { label: 'Top Speed', location: 'spec', path: 'engine_performance.top_speed', type: 'string', unit: 'km/h' },
    // ADAS section
    'adas.adaptive_cruise_control': { label: 'Adaptive Cruise Control', location: 'spec', path: 'adas.adaptive_cruise_control', type: 'boolean' },
    'adas.lane_keep_assist': { label: 'Lane Keep Assist', location: 'spec', path: 'adas.lane_keep_assist', type: 'boolean' },
    'adas.lane_departure_warning': { label: 'Lane Departure Warning', location: 'spec', path: 'adas.lane_departure_warning', type: 'boolean' },
    'adas.blind_spot_monitoring': { label: 'Blind Spot Monitor', location: 'spec', path: 'adas.blind_spot_monitoring', type: 'boolean' },
    'adas.forward_collision_warning': { label: 'Forward Collision Warning', location: 'spec', path: 'adas.forward_collision_warning', type: 'boolean' },
    'adas.automatic_emergency_braking': { label: 'Automatic Emergency Braking', location: 'spec', path: 'adas.automatic_emergency_braking', type: 'boolean' },
    // Infotainment & Connectivity
    'infotainment_connectivity.touchscreen': { label: 'Touchscreen', location: 'spec', path: 'infotainment_connectivity.touchscreen', type: 'string', hint: 'e.g. Yes (8-inch) or No' },
    'infotainment_connectivity.android_auto': { label: 'Android Auto', location: 'spec', path: 'infotainment_connectivity.android_auto', type: 'boolean' },
    'infotainment_connectivity.apple_carplay': { label: 'Apple CarPlay', location: 'spec', path: 'infotainment_connectivity.apple_carplay', type: 'boolean' },
    'infotainment_connectivity.bluetooth': { label: 'Bluetooth Connectivity', location: 'spec', path: 'infotainment_connectivity.bluetooth', type: 'boolean' },
    'infotainment_connectivity.speakers': { label: 'Speakers', location: 'spec', path: 'infotainment_connectivity.speakers', type: 'number' },
    'infotainment_connectivity.wireless_charging': { label: 'Wireless Charging', location: 'spec', path: 'infotainment_connectivity.wireless_charging', type: 'boolean' },
    // Connected Car
    'connected_car.connected_car_tech': { label: 'Connected Car Tech', location: 'spec', path: 'connected_car.connected_car_tech', type: 'string', hint: 'e.g. BlueLink, Suzuki Connect, or No' },
    'connected_car.app_connectivity': { label: 'App Connectivity', location: 'spec', path: 'connected_car.app_connectivity', type: 'boolean' },
    'connected_car.geofencing': { label: 'Geo Fencing', location: 'spec', path: 'connected_car.geofencing', type: 'boolean' },
    'connected_car.live_location': { label: 'Live Location', location: 'spec', path: 'connected_car.live_location', type: 'boolean' },
    // Exterior
    'exterior.headlight_type': { label: 'Headlight Type', location: 'spec', path: 'exterior.headlight_type', type: 'string', hint: 'e.g. LED Projector, Halogen' },
    'exterior.led_headlights': { label: 'LED Headlights', location: 'spec', path: 'exterior.led_headlights', type: 'boolean' },
    'exterior.drl': { label: 'LED DRLs', location: 'spec', path: 'exterior.drl', type: 'boolean' },
    'exterior.roof_rails': { label: 'Roof Rails', location: 'spec', path: 'exterior.roof_rails', type: 'boolean' },
    'exterior.spoiler': { label: 'Spoiler', location: 'spec', path: 'exterior.spoiler', type: 'boolean' },
    // Warranty
    'warranty.basic_warranty_years': { label: 'Basic Warranty (Years)', location: 'spec', path: 'warranty.basic_warranty_years', type: 'number' },
    'warranty.basic_warranty_km': { label: 'Basic Warranty (km)', location: 'spec', path: 'warranty.basic_warranty_km', type: 'number' },
    'warranty.battery_warranty_years': { label: 'Battery Warranty (Years)', location: 'spec', path: 'warranty.battery_warranty_years', type: 'number' },
    'warranty.battery_warranty_km': { label: 'Battery Warranty (km)', location: 'spec', path: 'warranty.battery_warranty_km', type: 'number' },
    // Storage Cabin Practicality
    'storage_cabin_practicality.cupholders_front': { label: 'Front Cupholders', location: 'spec', path: 'storage_cabin_practicality.cupholders_front', type: 'number' },
    'storage_cabin_practicality.cupholders_rear': { label: 'Rear Cupholders', location: 'spec', path: 'storage_cabin_practicality.cupholders_rear', type: 'number' },
    'storage_cabin_practicality.cooled_glovebox': { label: 'Cooled Glovebox', location: 'spec', path: 'storage_cabin_practicality.cooled_glovebox', type: 'boolean' },
    'storage_cabin_practicality.rear_armrest': { label: 'Rear Armrest', location: 'spec', path: 'storage_cabin_practicality.rear_armrest', type: 'boolean' },
    // Driver Display Controls
    'driver_display_controls.instrument_cluster': { label: 'Instrument Cluster', location: 'spec', path: 'driver_display_controls.instrument_cluster', type: 'string', hint: 'e.g. Digital, Semi-Digital, Analog' },
    'driver_display_controls.cluster_size': { label: 'Cluster Size', location: 'spec', path: 'driver_display_controls.cluster_size', type: 'string' },
    'driver_display_controls.heads_up_display': { label: 'Heads-Up Display (HUD)', location: 'spec', path: 'driver_display_controls.heads_up_display', type: 'boolean' },
    'driver_display_controls.steering_mounted_controls': { label: 'Steering Mounted Controls', location: 'spec', path: 'driver_display_controls.steering_mounted_controls', type: 'boolean' },
};
class SpecRefinementService {
    static client = null;
    static getClient() {
        if (!this.client) {
            if (!process.env.CEREBRAS_API_KEY) {
                throw new app_error_util_1.AppError('CEREBRAS_API_KEY is not set — spec refinement is disabled', 503);
            }
            this.client = new cerebras_cloud_sdk_1.default({ apiKey: process.env.CEREBRAS_API_KEY });
        }
        return this.client;
    }
    static async refineVariantSpecs(variantId) {
        const variant = await car_variant_model_1.CarVariant.findOne({ variant_id: variantId });
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        // Get car details for context
        const car = await car_model_1.Car.findOne({ car_id: variant.car_id });
        return this.performRefinement(variant, car);
    }
    // Internal method that accepts variant and car objects (no refetch)
    static async performRefinement(variant, car) {
        const variantId = variant.variant_id;
        // Build context for LLM
        const currentSpecs = variant.specs_normalized || {};
        const missingFields = this.identifyMissingFields(currentSpecs);
        const emptyOrLowQualityFields = this.identifyLowQualityFields(currentSpecs);
        if (missingFields.length === 0 && emptyOrLowQualityFields.length === 0) {
            return {
                variant_id: variantId,
                variant_name: variant.variant_name,
                suggestions: [],
                generated_at: new Date().toISOString(),
            };
        }
        const prompt = this.buildRefinementPrompt(variant, car, currentSpecs, missingFields, emptyOrLowQualityFields);
        try {
            const AI_TIMEOUT_MS = 15_000;
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT: spec refinement exceeded 15s')), AI_TIMEOUT_MS));
            const message = await Promise.race([
                this.getClient().chat.completions.create({
                    model: 'gpt-oss-120b',
                    max_tokens: 1024,
                    messages: [{ role: 'user', content: prompt }],
                }),
                timeoutPromise,
            ]);
            const responseText = message.choices[0]?.message?.content || '';
            const suggestions = this.parseRefinementResponse(responseText);
            return {
                variant_id: variantId,
                variant_name: variant.variant_name,
                suggestions: suggestions.slice(0, 5),
                generated_at: new Date().toISOString(),
            };
        }
        catch (error) {
            const isTimeout = error?.message?.startsWith('AI_TIMEOUT');
            console.error(isTimeout ? 'LLM refinement timed out (15s)' : 'LLM refinement failed:', error?.message);
            return {
                variant_id: variantId,
                variant_name: variant.variant_name,
                suggestions: [],
                generated_at: new Date().toISOString(),
            };
        }
    }
    static buildRefinementPrompt(variant, car, specs, missingFields, lowQualityFields) {
        return `You are an automotive specification expert. Analyze this car variant and suggest improvements.

Car: ${car?.car_name || 'Unknown'}
Variant: ${variant.variant_name}
Fuel Type: ${variant.fuel_type_id || 'Unknown'}
Transmission: ${variant.transmission_type || 'Unknown'}
Seating: ${variant.seating_capacity || 'Unknown'}
Price: ₹${variant.ex_showroom_price ? variant.ex_showroom_price / 100000 : 'Not set'}L

Current Specifications:
${JSON.stringify(specs, null, 2)}

Missing or low-quality fields to improve:
${missingFields.concat(lowQualityFields).join(', ')}

For each field that needs improvement, provide:
1. Field name
2. Current value (or "missing")
3. Suggested value based on typical ${car?.car_name || 'car'} specs
4. Brief reason
5. Confidence (0.6-1.0)

Format each suggestion as JSON: {"field": "...", "current": "...", "suggested": "...", "reason": "...", "confidence": 0.8}

Provide 3-5 most impactful suggestions only.`;
    }
    static identifyMissingFields(specs) {
        // Map flat field names to nested paths in specs_normalized
        const importantFields = {
            'engine_displacement': 'engine_performance.displacement',
            'power_bhp': 'engine_performance.max_power',
            'torque_nm': 'engine_performance.max_torque',
            'fuel_tank_capacity': 'mileage_range.fuel_tank_capacity',
            'boot_space': 'dimensions_practicality.boot_space',
            'ground_clearance': 'dimensions_practicality.ground_clearance',
            'acceleration_0_100': 'engine_performance.acceleration_0_100',
            'top_speed': 'engine_performance.top_speed',
            'arai_mileage': 'mileage_range.arai_mileage',
        };
        const missing = [];
        Object.entries(importantFields).forEach(([fieldName, nestedPath]) => {
            const keys = nestedPath.split('.');
            let current = specs;
            for (const key of keys) {
                current = current?.[key];
            }
            if (!current || current === null || current === undefined || current === '') {
                missing.push(fieldName);
            }
        });
        return missing;
    }
    static identifyLowQualityFields(specs) {
        const lowQuality = [];
        // Check for very short descriptions
        const descriptions = ['features', 'highlights', 'description'];
        descriptions.forEach((field) => {
            if (specs[field] && typeof specs[field] === 'string' && specs[field].length < 20) {
                lowQuality.push(field);
            }
        });
        // Check for missing units or formatting
        if (specs.power_bhp && typeof specs.power_bhp === 'number' && specs.power_bhp > 1000) {
            lowQuality.push('power_bhp'); // Likely missing unit conversion
        }
        return lowQuality;
    }
    static parseRefinementResponse(response) {
        const suggestions = [];
        // Try to extract JSON objects using more robust approach
        // Look for patterns: {...} and try to parse them
        const jsonPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
        const jsonMatches = response.match(jsonPattern) || [];
        jsonMatches.forEach((jsonStr) => {
            try {
                const parsed = JSON.parse(jsonStr);
                // Validate it looks like a refinement suggestion
                if (parsed.field) {
                    suggestions.push({
                        field: parsed.field || '',
                        current_value: parsed.current || parsed.current_value || 'missing',
                        suggested_value: parsed.suggested || parsed.suggested_value || '',
                        reason: parsed.reason || '',
                        confidence: Math.min(1, Math.max(0.6, parsed.confidence || 0.7)),
                    });
                }
            }
            catch (e) {
                // Skip malformed JSON
            }
        });
        return suggestions;
    }
    static async applyRefinementSuggestions(variantId, suggestions) {
        const variant = await car_variant_model_1.CarVariant.findOne({ variant_id: variantId });
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        const updatedSpecs = JSON.parse(JSON.stringify(variant.specs_normalized || {}));
        const importantFields = {
            'engine_displacement': 'engine_performance.displacement',
            'power_bhp': 'engine_performance.max_power',
            'torque_nm': 'engine_performance.max_torque',
            'fuel_tank_capacity': 'mileage_range.fuel_tank_capacity',
            'boot_space': 'dimensions_practicality.boot_space',
            'ground_clearance': 'dimensions_practicality.ground_clearance',
            'acceleration_0_100': 'engine_performance.acceleration_0_100',
            'top_speed': 'engine_performance.top_speed',
            'arai_mileage': 'mileage_range.arai_mileage',
        };
        const setNestedValue = (obj, path, value) => {
            const keys = path.split('.');
            let current = obj;
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!current[key] || typeof current[key] !== 'object') {
                    current[key] = {};
                }
                current = current[key];
            }
            current[keys[keys.length - 1]] = value;
        };
        // Apply each suggestion with high confidence
        suggestions.forEach((suggestion) => {
            if (suggestion.confidence >= 0.8) {
                const nestedPath = importantFields[suggestion.field] || suggestion.field;
                setNestedValue(updatedSpecs, nestedPath, suggestion.suggested_value);
            }
        });
        const updated = await car_variant_model_1.CarVariant.findOneAndUpdate({ variant_id: variantId }, {
            specs_normalized: updatedSpecs,
            updated_at: new Date(),
        }, { new: true });
        return updated?.toObject();
    }
    /**
     * Identify the fields validation flags as missing (intersected with the
     * registry of AI-fillable fields), then ask the AI to suggest a value for
     * each so the admin can verify and one-click save into the DB.
     */
    static async suggestMissingFields(variantId) {
        const variant = await car_variant_model_1.CarVariant.findOne({ variant_id: variantId });
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        const car = await car_model_1.Car.findOne({ car_id: variant.car_id });
        const validation = await variant_validation_service_1.VariantValidationService.validateVariant(variantId);
        // Collect candidate field keys from errors, warnings and missing criticals,
        // normalising the "specs." prefix that validation uses for nested warnings.
        const candidates = new Set();
        validation.errors.forEach((e) => candidates.add(e.field.replace(/^specs\./, '')));
        validation.warnings.forEach((w) => candidates.add(w.field.replace(/^specs\./, '')));
        validation.missing_critical_fields.forEach((f) => candidates.add(f.replace(/^specs\./, '')));
        // Expand empty sections to their individual constituent fields from the registry
        const expandedCandidates = new Set();
        candidates.forEach((cand) => {
            let isSection = false;
            Object.keys(MISSING_FIELD_REGISTRY).forEach((registryKey) => {
                if (registryKey.startsWith(`${cand}.`)) {
                    expandedCandidates.add(registryKey);
                    isSection = true;
                }
            });
            if (!isSection) {
                expandedCandidates.add(cand);
            }
        });
        const missingKeys = Array.from(expandedCandidates).filter((k) => MISSING_FIELD_REGISTRY[k]);
        if (missingKeys.length === 0) {
            return {
                variant_id: variantId,
                variant_name: variant.variant_name,
                fields: [],
                generated_at: new Date().toISOString(),
            };
        }
        let aiValues = {};
        try {
            const prompt = this.buildMissingFieldsPrompt(variant, car, missingKeys);
            const AI_TIMEOUT_MS = 15_000;
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT: missing-field fill exceeded 15s')), AI_TIMEOUT_MS));
            const message = await Promise.race([
                this.getClient().chat.completions.create({
                    model: 'gpt-oss-120b',
                    max_tokens: 1024,
                    messages: [{ role: 'user', content: prompt }],
                }),
                timeoutPromise,
            ]);
            const responseText = message.choices[0]?.message?.content || '';
            aiValues = this.parseMissingFieldsResponse(responseText);
        }
        catch (error) {
            const isTimeout = error?.message?.startsWith('AI_TIMEOUT');
            console.error(isTimeout ? 'Missing-field AI timed out (15s)' : 'Missing-field AI suggestion failed:', error?.message);
        }
        const fields = missingKeys.map((key) => {
            const meta = MISSING_FIELD_REGISTRY[key];
            const ai = aiValues[key];
            return {
                field: key,
                label: meta.label,
                location: meta.location,
                type: meta.type,
                unit: meta.unit,
                suggested_value: ai?.value ?? '',
                reason: ai?.reason || '',
                confidence: ai ? Math.min(1, Math.max(0, ai.confidence || 0.7)) : 0,
            };
        });
        return {
            variant_id: variantId,
            variant_name: variant.variant_name,
            fields,
            generated_at: new Date().toISOString(),
        };
    }
    static buildMissingFieldsPrompt(variant, car, missingKeys) {
        const fieldList = missingKeys
            .map((key) => {
            const meta = MISSING_FIELD_REGISTRY[key];
            const unit = meta.unit ? ` [unit: ${meta.unit}]` : '';
            const hint = meta.hint ? ` [${meta.hint}]` : '';
            return `- ${key} (${meta.label}, ${meta.type})${unit}${hint}`;
        })
            .join('\n');
        return `You are an automotive specification expert. Provide the most likely real value for each missing field of this specific car variant. Base your answer on the actual published specifications for this exact model/variant where known.

Car: ${car?.car_name || 'Unknown'}
Brand car_id: ${variant.car_id}
Variant: ${variant.variant_name}
Fuel Type: ${variant.fuel_type_id || 'Unknown'}
Transmission: ${variant.transmission_type || 'Unknown'}
Seating: ${variant.seating_capacity || 'Unknown'}

Missing fields to fill:
${fieldList}

Rules:
- Give the raw value only (numbers without units, no commas). For prices use the full rupee value (e.g. 1200000, not "12 lakh").
- If you are unsure, give your best typical estimate for this class of vehicle and lower the confidence.
- Return ONLY a JSON array, one object per field, no prose:
[{"field":"<key>","value":<value>,"reason":"<short reason>","confidence":0.8}]`;
    }
    static parseMissingFieldsResponse(response) {
        const result = {};
        const jsonPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
        const jsonMatches = response.match(jsonPattern) || [];
        jsonMatches.forEach((jsonStr) => {
            try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.field && MISSING_FIELD_REGISTRY[parsed.field]) {
                    result[parsed.field] = {
                        value: parsed.value ?? parsed.suggested ?? parsed.suggested_value ?? '',
                        reason: parsed.reason || '',
                        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
                    };
                }
            }
            catch (e) {
                // Skip malformed JSON
            }
        });
        return result;
    }
    /**
     * Apply admin-verified values for missing fields. Routes the write through
     * CarVariantService.updateVariant so audit + change-history are recorded.
     */
    static async applyMissingFieldValues(variantId, values, actor = null) {
        const variant = await car_variant_model_1.CarVariant.findOne({ variant_id: variantId });
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        const updatePayload = {};
        const updatedSpecs = JSON.parse(JSON.stringify(variant.specs_normalized || {}));
        let specsTouched = false;
        for (const entry of values) {
            const meta = MISSING_FIELD_REGISTRY[entry?.field];
            if (!meta)
                continue;
            if (entry.value === '' || entry.value === null || entry.value === undefined)
                continue;
            let coerced = entry.value;
            if (meta.type === 'number') {
                coerced = Number(String(entry.value).replace(/[, ]/g, ''));
                if (Number.isNaN(coerced))
                    continue;
            }
            else if (meta.type === 'boolean') {
                coerced = String(entry.value).trim().toLowerCase() === 'true' || entry.value === true;
            }
            else {
                coerced = String(entry.value).trim();
                if (!coerced)
                    continue;
            }
            if (meta.location === 'top') {
                updatePayload[entry.field] = coerced;
            }
            else if (meta.path) {
                this.setNestedValue(updatedSpecs, meta.path, coerced);
                specsTouched = true;
            }
        }
        if (Object.keys(updatePayload).length === 0 && !specsTouched) {
            throw new app_error_util_1.AppError('No valid field values to apply', 400);
        }
        if (specsTouched) {
            updatePayload.specs_normalized = updatedSpecs;
        }
        // Dynamic import keeps this service free of any import cycle with CarVariantService.
        const { CarVariantService } = await Promise.resolve().then(() => __importStar(require('../../cars/services/car-variant.service')));
        return CarVariantService.updateVariant(variantId, updatePayload, actor);
    }
    static setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        current[keys[keys.length - 1]] = value;
    }
    static async refineMultipleVariants(variantIds) {
        // Batch load all variants with their car data
        const variants = await car_variant_model_1.CarVariant.find({ variant_id: { $in: variantIds } }).lean();
        const carIds = Array.from(new Set(variants.map((v) => v.car_id).filter(Boolean)));
        const cars = await car_model_1.Car.find({ car_id: { $in: carIds } }).lean();
        // Create maps for O(1) lookup
        const carById = new Map(cars.map((c) => [c.car_id, c]));
        // Parallelize LLM refinement calls instead of sequential
        const refinementPromises = variants.map(variant => this.performRefinement(variant, carById.get(variant.car_id) || null)
            .catch(error => {
            console.error(`Failed to refine variant ${variant.variant_id}:`, error);
            return {
                variant_id: variant.variant_id,
                variant_name: variant.variant_name,
                suggestions: [],
                generated_at: new Date().toISOString(),
            };
        }));
        return Promise.all(refinementPromises);
    }
}
exports.SpecRefinementService = SpecRefinementService;
//# sourceMappingURL=spec-refinement.service.js.map