import { CarVariant, ICarVariant } from '../../../models/car-variant.model';
import { AppError } from '../../../shared/utils/app-error.util';

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
    const variant = await CarVariant.findById(variantId);

    if (!variant) {
      throw new AppError('Variant not found', 404);
    }

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
    const variants = await CarVariant.find({ car_id: carId }).select('_id');
    const results: Record<string, ValidationResult> = {};

    for (const variant of variants) {
      results[variant._id.toString()] = await this.validateVariant(variant._id.toString());
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

    for (const id of variantIds) {
      results[id] = await this.validateVariant(id);
    }

    return results;
  }

  static getValidationRulesByStatus(status: string): string[] {
    return this.REQUIRED_FIELDS_BY_STATUS[status] || [];
  }
}
