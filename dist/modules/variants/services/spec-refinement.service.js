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
    static client = new sdk_1.default();
    static async refineVariantSpecs(variantId) {
        const variant = await car_variant_model_1.CarVariant.findById(variantId);
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        // Get car details for context
        const car = await car_model_1.Car.findById(variant.car_id);
        return this.performRefinement(variant, car);
    }
    // Internal method that accepts variant and car objects (no refetch)
    static async performRefinement(variant, car) {
        const variantId = variant._id.toString();
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
            const message = await this.client.messages.create({
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
        const importantFields = [
            'engine_displacement',
            'power_bhp',
            'torque_nm',
            'fuel_tank_capacity',
            'boot_space',
            'ground_clearance',
            'dimensions',
            'acceleration_0_100kmph',
            'top_speed',
            'fuel_efficiency',
        ];
        return importantFields.filter((field) => !specs[field] || specs[field] === null || specs[field] === undefined || specs[field] === '');
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
        // Extract JSON objects from response
        const jsonMatches = response.match(/\{[^}]*"field"[^}]*\}/g) || [];
        jsonMatches.forEach((jsonStr) => {
            try {
                const parsed = JSON.parse(jsonStr);
                suggestions.push({
                    field: parsed.field || '',
                    current_value: parsed.current || 'missing',
                    suggested_value: parsed.suggested || '',
                    reason: parsed.reason || '',
                    confidence: parsed.confidence || 0.7,
                });
            }
            catch (e) {
                // Skip malformed JSON
            }
        });
        return suggestions;
    }
    static async applyRefinementSuggestions(variantId, suggestions) {
        const variant = await car_variant_model_1.CarVariant.findById(variantId);
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
        const updated = await car_variant_model_1.CarVariant.findByIdAndUpdate(variantId, {
            specs_normalized: updatedSpecs,
            updated_at: new Date(),
        }, { new: true });
        return updated?.toObject();
    }
    static async refineMultipleVariants(variantIds) {
        // Batch load all variants with their car data
        const variants = await car_variant_model_1.CarVariant.find({ _id: { $in: variantIds } }).lean();
        const carIds = Array.from(new Set(variants.map((v) => v.car_id).filter(Boolean)));
        const cars = await car_model_1.Car.find({ _id: { $in: carIds } }).lean();
        // Create maps for O(1) lookup
        const carById = new Map(cars.map((c) => [c._id.toString(), c]));
        // Parallelize LLM refinement calls instead of sequential
        const refinementPromises = variants.map(variant => this.performRefinement(variant, carById.get(variant.car_id?.toString()) || null)
            .catch(error => {
            console.error(`Failed to refine variant ${variant._id}:`, error);
            return {
                variant_id: variant._id.toString(),
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