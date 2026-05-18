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
export declare class VariantValidationService {
    private static REQUIRED_FIELDS_BY_STATUS;
    private static CRITICAL_SPEC_FIELDS;
    static validateVariant(variantId: string): Promise<ValidationResult>;
    private static performValidation;
    static validateCarVariants(carId: string): Promise<Record<string, ValidationResult>>;
    private static calculateCompletenessScore;
    static validateBatch(variantIds: string[]): Promise<Record<string, ValidationResult>>;
    static getValidationRulesByStatus(status: string): string[];
    /**
     * Validate automotive constraints (Batch 6)
     * Prevents impossible combinations like EV with fuel tank, invalid transmissions, etc.
     */
    static validateAutomotiveConstraints(variant: any): {
        isValid: boolean;
        errors: Array<{
            rule: string;
            message: string;
        }>;
        warnings: Array<{
            rule: string;
            message: string;
        }>;
    };
    /**
     * Combined validation: completeness + automotive constraints
     */
    static validateVariantFull(variantId: string): Promise<ValidationResult & {
        automotiveErrors: Array<{
            rule: string;
            message: string;
        }>;
        automotiveWarnings: Array<{
            rule: string;
            message: string;
        }>;
    }>;
}
//# sourceMappingURL=variant-validation.service.d.ts.map