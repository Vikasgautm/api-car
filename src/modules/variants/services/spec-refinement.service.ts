import { CarVariant } from '../../../models/car-variant.model';
import { Car } from '../../../models/car.model';
import { AppError } from '../../../shared/utils/app-error.util';
import Anthropic from '@anthropic-ai/sdk';

export interface SpecRefinementSuggestion {
  field: string;
  current_value: any;
  suggested_value: any;
  reason: string;
  confidence: number;
}

export interface SpecRefinementResult {
  variant_id: string;
  variant_name: string;
  suggestions: SpecRefinementSuggestion[];
  generated_at: string;
}

export class SpecRefinementService {
  private static client = new Anthropic();

  static async refineVariantSpecs(variantId: string): Promise<SpecRefinementResult> {
    const variant = await CarVariant.findById(variantId);

    if (!variant) {
      throw new AppError('Variant not found', 404);
    }

    // Get car details for context
    const car = await Car.findById(variant.car_id);

    return this.performRefinement(variant, car);
  }

  // Internal method that accepts variant and car objects (no refetch)
  private static async performRefinement(variant: any, car: any | null): Promise<SpecRefinementResult> {
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

      const responseText =
        message.content[0].type === 'text' ? message.content[0].text : '';
      const suggestions = this.parseRefinementResponse(responseText);

      return {
        variant_id: variantId,
        variant_name: variant.variant_name,
        suggestions: suggestions.slice(0, 5), // Limit to 5 suggestions
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('LLM refinement failed:', error);
      return {
        variant_id: variantId,
        variant_name: variant.variant_name,
        suggestions: [],
        generated_at: new Date().toISOString(),
      };
    }
  }

  private static buildRefinementPrompt(
    variant: any,
    car: any,
    specs: any,
    missingFields: string[],
    lowQualityFields: string[]
  ): string {
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

  private static identifyMissingFields(specs: any): string[] {
    // Map flat field names to nested paths in specs_normalized
    const importantFields: { [key: string]: string } = {
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

    const missing: string[] = [];

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

  private static identifyLowQualityFields(specs: any): string[] {
    const lowQuality: string[] = [];

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

  private static parseRefinementResponse(response: string): SpecRefinementSuggestion[] {
    const suggestions: SpecRefinementSuggestion[] = [];

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
      } catch (e) {
        // Skip malformed JSON
      }
    });

    return suggestions;
  }

  static async applyRefinementSuggestions(
    variantId: string,
    suggestions: SpecRefinementSuggestion[]
  ): Promise<any> {
    const variant = await CarVariant.findById(variantId);

    if (!variant) {
      throw new AppError('Variant not found', 404);
    }

    const updatedSpecs = { ...(variant as any).specs_normalized } as Record<string, any>;

    // Apply each suggestion with high confidence
    suggestions.forEach((suggestion) => {
      if (suggestion.confidence >= 0.8) {
        updatedSpecs[suggestion.field as string] = suggestion.suggested_value;
      }
    });

    const updated = await CarVariant.findByIdAndUpdate(
      variantId,
      {
        specs_normalized: updatedSpecs,
        updated_at: new Date(),
      },
      { new: true }
    );

    return updated?.toObject();
  }

  static async refineMultipleVariants(variantIds: string[]): Promise<SpecRefinementResult[]> {
    // Batch load all variants with their car data
    const variants = await CarVariant.find({ _id: { $in: variantIds } }).lean();
    const carIds = Array.from(new Set(variants.map((v: any) => v.car_id).filter(Boolean)));
    const cars = await Car.find({ _id: { $in: carIds } }).lean();

    // Create maps for O(1) lookup
    const carById = new Map(cars.map((c: any) => [c._id.toString(), c]));

    // Parallelize LLM refinement calls instead of sequential
    const refinementPromises = variants.map(variant =>
      this.performRefinement(variant, carById.get(variant.car_id?.toString()!) || null)
        .catch(error => {
          console.error(`Failed to refine variant ${variant._id}:`, error);
          return {
            variant_id: variant._id.toString(),
            variant_name: variant.variant_name,
            suggestions: [],
            generated_at: new Date().toISOString(),
          };
        })
    );

    return Promise.all(refinementPromises);
  }
}
