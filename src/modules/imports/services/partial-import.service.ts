import { CarVariant } from '../../../models/car-variant.model';
import { Car } from '../../../models/car.model';
import { AppError } from '../../../shared/utils/app-error.util';
import { AuditActor } from '../../../shared/utils/audit.util';
import { VariantLifecycleService } from '../../variants/services/variant-lifecycle.service';

interface PartialVariantImportData {
  variant_name?: string;
  expected_price?: number;
  expected_launch_date?: string;
  variant_highlights?: string[];
  estimated_fields?: Record<string, boolean>;
  specs_partial?: Record<string, any>;
  visibility_mode?: 'teaser' | 'partial' | 'hidden';
}

export class PartialImportService {
  /**
   * Import partial/teaser data for an upcoming variant
   * This is lenient about missing fields and marks them as estimated
   */
  static async importPartialVariant(
    carId: string,
    variantData: PartialVariantImportData,
    actor: AuditActor
  ) {
    // Parallelize car and variant lookups instead of sequential
    const [car, existingVariant] = await Promise.all([
      Car.findOne({ car_id: carId, is_deleted: false }),
      CarVariant.findOne({
        car_id: carId,
        variant_name: variantData.variant_name,
        is_deleted: false,
      }),
    ]);

    if (!car) {
      throw new AppError('Car not found', 404);
    }

    if (!car.is_upcoming && car.status !== 'upcoming') {
      throw new AppError('Car must be in upcoming status to import partial data', 400);
    }

    if (existingVariant) {
      // Update existing variant with partial data
      return await this.updatePartialVariant(existingVariant, variantData, actor);
    }

    // Create new variant with teaser/partial mode
    const variant = new CarVariant({
      variant_id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      car_id: carId,
      variant_name: variantData.variant_name || 'TBD',
      slug: `${car.slug}-${(variantData.variant_name || '').toLowerCase().replace(/\s+/g, '-')}`,
      model_year: new Date().getFullYear(),
      is_upcoming: true,
      market_status: 'upcoming',
      expected_price: variantData.expected_price,
      expected_launch_date: variantData.expected_launch_date
        ? new Date(variantData.expected_launch_date)
        : undefined,
      variant_highlights: variantData.variant_highlights || [],
      is_published: false,
      is_deleted: false,
      editor_user_id: actor.user_id || 'system',
    });

    // Set visibility mode
    const visibilityMode = variantData.visibility_mode || 'partial';
    await this.applyVisibilityMode(variant, visibilityMode, variantData.estimated_fields);

    // Add partial specs if provided
    if (variantData.specs_partial) {
      variant.specs_raw = variantData.specs_partial;
      this.applyPartialSpecs(variant, variantData.specs_partial);
    }

    await variant.save();

    // Record variant history in car
    const { CarLifecycleService } = await import('../../cars/services/car-lifecycle.service');
    await CarLifecycleService.recordVariantChange(
      carId,
      variant.variant_id,
      'added',
      actor,
      {
        mode: visibilityMode,
        source: 'partial_import',
      }
    );

    return variant;
  }

  /**
   * Update existing variant with partial data
   */
  private static async updatePartialVariant(
    variant: any,
    data: PartialVariantImportData,
    actor: AuditActor
  ) {
    if (data.expected_price) {
      variant.expected_price = data.expected_price;
    }

    if (data.expected_launch_date) {
      variant.expected_launch_date = new Date(data.expected_launch_date);
    }

    if (data.variant_highlights) {
      variant.variant_highlights = data.variant_highlights;
    }

    if (data.specs_partial) {
      variant.specs_raw = { ...variant.specs_raw, ...data.specs_partial };
      this.applyPartialSpecs(variant, data.specs_partial);
    }

    // Update visibility mode if specified
    if (data.visibility_mode) {
      await this.applyVisibilityMode(variant, data.visibility_mode, data.estimated_fields);
    }

    await variant.save();

    return variant;
  }

  /**
   * Apply partial specs to normalized structure
   * Only fill in what's provided, leave rest empty
   */
  private static applyPartialSpecs(variant: any, partialSpecs: Record<string, any>) {
    if (!variant.specs_normalized) {
      variant.specs_normalized = {};
    }

    // Map partial specs to normalized sections
    for (const [section, fields] of Object.entries(partialSpecs)) {
      if (!variant.specs_normalized[section as keyof any]) {
        variant.specs_normalized[section as keyof any] = {};
      }

      if (typeof fields === 'object' && fields !== null) {
        variant.specs_normalized[section as keyof any] = {
          ...variant.specs_normalized[section as keyof any],
          ...fields,
        };
      }
    }
  }

  /**
   * Apply visibility mode to variant
   */
  private static async applyVisibilityMode(
    variant: any,
    mode: 'teaser' | 'partial' | 'hidden',
    estimatedFields?: Record<string, boolean>
  ) {
    const sectionKeys = [
      'engine_performance',
      'mileage_range',
      'battery_charging',
      'dimensions_practicality',
      'suspension_steering_brakes',
      'tyres_wheels',
      'safety',
      'adas',
      'comfort_convenience',
      'infotainment_connectivity',
      'connected_car',
      'interior',
      'exterior',
      'warranty',
      'storage_cabin_practicality',
      'driver_display_controls',
    ];

    switch (mode) {
      case 'teaser':
        // Only show basic info and highlights
        variant.section_visibility = sectionKeys.map((key) => ({
          section_key: key,
          visibility: 'teaser_only',
          hidden_fields: [],
        }));
        break;

      case 'partial':
        // Show available sections, hide empty ones
        variant.section_visibility = sectionKeys.map((key) => ({
          section_key: key,
          visibility: variant.specs_normalized?.[key as keyof any] ? 'partial' : 'hidden',
          hidden_fields: [],
        }));
        break;

      case 'hidden':
        // Hide all sections until launch
        variant.section_visibility = sectionKeys.map((key) => ({
          section_key: key,
          visibility: 'hidden',
          hidden_fields: [],
        }));
        break;
    }

    // Mark fields as estimated
    if (estimatedFields) {
      variant.estimated_fields = estimatedFields;
    }
  }

  /**
   * Convert partial variant to full variant on launch
   * Unhide all sections and update market status
   */
  static async promotePartialToLaunched(variantId: string, actor: AuditActor) {
    const variant = await CarVariant.findOne({ variant_id: variantId, is_deleted: false });
    if (!variant) {
      throw new AppError('Variant not found', 404);
    }

    // Use variant lifecycle service to unhide sections
    await VariantLifecycleService.unhideAllSections(variantId);

    // Update market status
    variant.market_status = 'available';
    variant.is_upcoming = false;

    await variant.save();

    return variant;
  }

  /**
   * Validate that partial import has minimum required data
   */
  static validatePartialImport(data: PartialVariantImportData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.variant_name || !data.variant_name.trim()) {
      errors.push('Variant name is required');
    }

    if (!data.expected_launch_date) {
      errors.push('Expected launch date is required for upcoming variants');
    }

    if (!data.variant_highlights || data.variant_highlights.length === 0) {
      errors.push('At least one variant highlight is required for teaser content');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
