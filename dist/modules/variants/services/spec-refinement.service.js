"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecRefinementService = void 0;
const car_variant_model_1 = require("../../../models/car-variant.model");
const car_model_1 = require("../../../models/car.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
class SpecRefinementService {
    static client = null;
    static getClient() {
        if (!this.client) {
            if (!process.env.ANTHROPIC_API_KEY) {
                throw new app_error_util_1.AppError('ANTHROPIC_API_KEY is not set — spec refinement is disabled', 503);
            }
            this.client = new sdk_1.default();
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
            const message = await this.getClient().messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            });
            const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
            const suggestions = this.parseRefinementResponse(responseText);
            return {
                variant_id: variantId,
                variant_name: variant.variant_name,
                suggestions: suggestions.slice(0, 5), // Limit to 5 suggestions
                generated_at: new Date().toISOString(),
            };
        }
        catch (error) {
            console.error('LLM refinement failed:', error);
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
        const updatedSpecs = { ...variant.specs_normalized };
        // Apply each suggestion with high confidence
        suggestions.forEach((suggestion) => {
            if (suggestion.confidence >= 0.8) {
                updatedSpecs[suggestion.field] = suggestion.suggested_value;
            }
        });
        const updated = await car_variant_model_1.CarVariant.findOneAndUpdate({ variant_id: variantId }, {
            specs_normalized: updatedSpecs,
            updated_at: new Date(),
        }, { new: true });
        return updated?.toObject();
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