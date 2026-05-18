"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariantValidationService = void 0;
const car_variant_model_1 = require("../../../models/car-variant.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const automotive_validation_rules_1 = require("../../../shared/utils/automotive-validation-rules");
class VariantValidationService {
    static REQUIRED_FIELDS_BY_STATUS = {
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
    static CRITICAL_SPEC_FIELDS = [
        'engine_displacement',
        'power_bhp',
        'torque_nm',
        'fuel_tank_capacity',
        'boot_space',
        'dimensions',
    ];
    static async validateVariant(variantId) {
        const variant = await car_variant_model_1.CarVariant.findById(variantId);
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        return this.performValidation(variant);
    }
    // Internal method that accepts variant object directly (no refetch)
    static performValidation(variant) {
        const errors = [];
        const warnings = [];
        // Check required fields based on status
        const status = variant.variant_status || 'draft';
        const requiredFields = this.REQUIRED_FIELDS_BY_STATUS[status] || [];
        const missingCritical = [];
        for (const field of requiredFields) {
            const value = variant[field];
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
        const specs = variant.specs_normalized;
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
            const sections = Object.keys(specs).filter((key) => typeof specs[key] === 'object' && specs[key] !== null && !Array.isArray(specs[key]));
            for (const section of sections) {
                const sectionData = specs[section];
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
    static async validateCarVariants(carId) {
        // Fetch all variants with full data (not just _id) to avoid refetching in loop
        const variants = await car_variant_model_1.CarVariant.find({ car_id: carId });
        const results = {};
        // Validate each variant without refetching
        for (const variant of variants) {
            results[variant._id.toString()] = this.performValidation(variant);
        }
        return results;
    }
    static calculateCompletenessScore(variant) {
        let score = 0;
        const totalChecks = 10;
        let filledChecks = 0;
        // Check basic fields
        if (variant.variant_name)
            filledChecks++;
        if (variant.fuel_type_id)
            filledChecks++;
        if (variant.transmission_type)
            filledChecks++;
        if (variant.seating_capacity)
            filledChecks++;
        if (variant.ex_showroom_price || variant.expected_price)
            filledChecks++;
        // Check specs
        if (variant.specs_normalized && Object.keys(variant.specs_normalized).length > 0)
            filledChecks++;
        // Check visibility/status
        if (variant.variant_status && variant.variant_status !== 'draft')
            filledChecks++;
        if (variant.is_published)
            filledChecks++;
        // Check model year or expected launch
        if (variant.model_year || variant.expected_launch_date)
            filledChecks++;
        // Check if has images or media
        if (variant.images && Array.isArray(variant.images) && variant.images.length > 0)
            filledChecks++;
        score = Math.round((filledChecks / totalChecks) * 100);
        return Math.min(100, Math.max(0, score));
    }
    static async validateBatch(variantIds) {
        const results = {};
        // Fetch all variants in parallel to avoid N findById calls
        const variants = await car_variant_model_1.CarVariant.find({ _id: { $in: variantIds } }).lean();
        const variantMap = new Map(variants.map((v) => [v._id.toString(), v]));
        // Parallelize validation instead of sequential
        const validations = await Promise.allSettled(variantIds.map(id => {
            const variant = variantMap.get(id);
            if (!variant) {
                return Promise.reject(new app_error_util_1.AppError('Variant not found', 404));
            }
            return Promise.resolve(this.performValidation(variant));
        }));
        validations.forEach((result, idx) => {
            const variantId = variantIds[idx];
            if (result.status === 'fulfilled') {
                results[variantId] = result.value;
            }
            else {
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
    static getValidationRulesByStatus(status) {
        return this.REQUIRED_FIELDS_BY_STATUS[status] || [];
    }
    /**
     * Validate automotive constraints (Batch 6)
     * Prevents impossible combinations like EV with fuel tank, invalid transmissions, etc.
     */
    static validateAutomotiveConstraints(variant) {
        return automotive_validation_rules_1.AutomotiveValidationRules.validateStrict(variant);
    }
    /**
     * Combined validation: completeness + automotive constraints
     */
    static async validateVariantFull(variantId) {
        const baseValidation = await this.validateVariant(variantId);
        const variant = await car_variant_model_1.CarVariant.findById(variantId);
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
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
exports.VariantValidationService = VariantValidationService;
//# sourceMappingURL=variant-validation.service.js.map