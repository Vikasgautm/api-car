import { CarVariant, ICarVariant } from '../../../models/car-variant.model';
import { AppError } from '../../../shared/utils/app-error.util';
import { AutomotiveValidationRules } from '../../../shared/utils/automotive-validation-rules';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  completeness_score: number;
  missing_critical_fields: string[];
}

export class VariantValidationService {
  private static REQUIRED_FIELDS_BY_STATUS: Record<string, string[]> = {
    draft: [],
    incomplete: ['variant_name', 'fuel_type_id', 'transmission_type'],
    review_pending: [
      'variant_name',
      'fuel_type_id',
      'transmission_type',
      'seating_capacity',
      'ex_showroom_price',
      'specs_normalized',
    ],
    hidden: [
      'variant_name',
      'fuel_type_id',
      'transmission_type',
      'seating_capacity',
      'ex_showroom_price',
      'specs_normalized',
    ],
    launched: [
      'variant_name',
      'fuel_type_id',
      'transmission_type',
      'seating_capacity',
      'ex_showroom_price',
      'specs_normalized',
      'model_year',
    ],
    upcoming: [
      'variant_name',
      'fuel_type_id',
      'transmission_type',
      'seating_capacity',
      'expected_launch_date',
      'expected_price',
      'specs_normalized',
    ],
    discontinued: [
      'variant_name',
      'fuel_type_id',
      'transmission_type',
      'seating_capacity',
      'ex_showroom_price',
    ],
  };

  private static CRITICAL_SPEC_FIELDS = [
    'engine_displacement',
    'power_bhp',
    'torque_nm',
    'fuel_tank_capacity',
    'boot_space',
    'dimensions',
  ];

  static async validateVariant(variantId: string): Promise<ValidationResult> {
    const variant = await CarVariant.findOne({ variant_id: variantId });

    if (!variant) {
      throw new AppError('Variant not found', 404);
    }

    return this.performValidation(variant);
  }

  // Internal method that accepts variant object directly (no refetch)
  private static performValidation(variant: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check required fields based on status
    const status = (variant as any).variant_status || 'draft';
    const requiredFields = this.REQUIRED_FIELDS_BY_STATUS[status] || [];
    const missingCritical: string[] = [];

    for (const field of requiredFields) {
      const value = (variant as any)[field];
      if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) {
        errors.push({
          field,
          message: `${field} is required for ${status} status`,
          severity: 'error',
        });
        if (this.CRITICAL_SPEC_FIELDS.includes(field)) {
          missingCritical.push(field);
        }
      }
    }

    // Price consistency checks
    if (variant.ex_showroom_price && variant.expected_price) {
      if (variant.expected_price < variant.ex_showroom_price * 0.9) {
        warnings.push({
          field: 'expected_price',
          message: 'Expected price is significantly lower than ex-showroom price',
          severity: 'warning',
        });
      }
    }

    // Spec validation
    const specs = (variant as any).specs_normalized as Record<string, any>;
    if (specs && typeof specs === 'object') {
      // Check for critical spec fields
      for (const field of this.CRITICAL_SPEC_FIELDS) {
        if (!specs[field] || specs[field] === null || specs[field] === undefined) {
          warnings.push({
            field: `specs.${field}`,
            message: `Critical spec field ${field} is missing`,
            severity: 'warning',
          });
        }
      }

      // Check for empty sections
      const sections = Object.keys(specs).filter(
        (key) => typeof specs[key] === 'object' && specs[key] !== null && !Array.isArray(specs[key])
      );
      for (const section of sections) {
        const sectionData = specs[section] as Record<string, any>;
        const filledFields = Object.keys(sectionData).filter((k) => sectionData[k]);
        if (filledFields.length === 0) {
          warnings.push({
            field: `specs.${section}`,
            message: `Section ${section} is completely empty`,
            severity: 'warning',
          });
        }
      }
    }

    // Seating capacity validation
    if (variant.seating_capacity && (variant.seating_capacity < 2 || variant.seating_capacity > 10)) {
      errors.push({
        field: 'seating_capacity',
        message: 'Seating capacity must be between 2 and 10',
        severity: 'error',
      });
    }

    // Model year validation
    if (variant.model_year) {
      const currentYear = new Date().getFullYear();
      if (variant.model_year < currentYear - 2 || variant.model_year > currentYear + 2) {
        warnings.push({
          field: 'model_year',
          message: `Model year ${variant.model_year} is unusual (current: ${currentYear})`,
          severity: 'warning',
        });
      }
    }

    // Completeness score (0-100)
    const completenessScore = this.calculateCompletenessScore(variant);

    // Publish status validation
    if (variant.is_published && errors.length > 0) {
      errors.unshift({
        field: 'is_published',
        message: 'Cannot publish variant with validation errors',
        severity: 'error',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completeness_score: completenessScore,
      missing_critical_fields: missingCritical,
    };
  }

  static async validateCarVariants(carId: string): Promise<Record<string, ValidationResult>> {
    // Fetch all variants with full data (not just _id) to avoid refetching in loop
    const variants = await CarVariant.find({ car_id: carId });
    const results: Record<string, ValidationResult> = {};

    // Validate each variant without refetching
    for (const variant of variants) {
      results[variant.variant_id] = this.performValidation(variant);
    }

    return results;
  }

  private static calculateCompletenessScore(variant: any): number {
    let score = 0;
    const totalChecks = 10;
    let filledChecks = 0;

    // Check basic fields
    if (variant.variant_name) filledChecks++;
    if (variant.fuel_type_id) filledChecks++;
    if (variant.transmission_type) filledChecks++;
    if (variant.seating_capacity) filledChecks++;
    if (variant.ex_showroom_price || variant.expected_price) filledChecks++;

    // Check specs
    if (variant.specs_normalized && Object.keys(variant.specs_normalized).length > 0) filledChecks++;

    // Check visibility/status
    if (variant.variant_status && variant.variant_status !== 'draft') filledChecks++;
    if (variant.is_published) filledChecks++;

    // Check model year or expected launch
    if (variant.model_year || variant.expected_launch_date) filledChecks++;

    // Check if has images or media
    if (variant.images && Array.isArray(variant.images) && variant.images.length > 0) filledChecks++;

    score = Math.round((filledChecks / totalChecks) * 100);
    return Math.min(100, Math.max(0, score));
  }

  static async validateBatch(variantIds: string[]): Promise<Record<string, ValidationResult>> {
    const results: Record<string, ValidationResult> = {};

    // Fetch all variants in parallel to avoid N findById calls
    const variants = await CarVariant.find({ variant_id: { $in: variantIds } }).lean();
    const variantMap = new Map(variants.map((v: any) => [v.variant_id, v]));

    // Parallelize validation instead of sequential
    const validations = await Promise.allSettled(
      variantIds.map(id => {
        const variant = variantMap.get(id);
        if (!variant) {
          return Promise.reject(new AppError('Variant not found', 404));
        }
        return Promise.resolve(this.performValidation(variant));
      })
    );

    validations.forEach((result, idx) => {
      const variantId = variantIds[idx];
      if (result.status === 'fulfilled') {
        results[variantId] = result.value;
      } else {
        results[variantId] = {
          isValid: false,
          errors: [{ field: 'variant', message: result.reason instanceof Error ? result.reason.message : 'Validation failed', severity: 'error' }],
          warnings: [],
          completeness_score: 0,
          missing_critical_fields: [],
        };
      }
    });

    return results;
  }

  static getValidationRulesByStatus(status: string): string[] {
    return this.REQUIRED_FIELDS_BY_STATUS[status] || [];
  }

  /**
   * Validate automotive constraints (Batch 6)
   * Prevents impossible combinations like EV with fuel tank, invalid transmissions, etc.
   */
  static validateAutomotiveConstraints(variant: any): {
    isValid: boolean;
    errors: Array<{ rule: string; message: string }>;
    warnings: Array<{ rule: string; message: string }>;
  } {
    return AutomotiveValidationRules.validateStrict(variant);
  }

  /**
   * Combined validation: completeness + automotive constraints
   */
  static async validateVariantFull(variantId: string): Promise<ValidationResult & {
    automotiveErrors: Array<{ rule: string; message: string }>;
    automotiveWarnings: Array<{ rule: string; message: string }>;
  }> {
    const baseValidation = await this.validateVariant(variantId);
    const variant = await CarVariant.findOne({ variant_id: variantId });

    if (!variant) {
      throw new AppError('Variant not found', 404);
    }

    const automotiveValidation = this.validateAutomotiveConstraints(variant.toObject());

    // Block publication if there are automotive errors
    if (variant.is_published && automotiveValidation.errors.length > 0) {
      baseValidation.errors.unshift({
        field: 'is_published',
        message: 'Cannot publish variant with automotive constraint violations',
        severity: 'error',
      });
    }

    return {
      ...baseValidation,
      automotiveErrors: automotiveValidation.errors,
      automotiveWarnings: automotiveValidation.warnings,
    };
  }
}
