export interface SpecValidationError {
    field: string;
    message: string;
}
export interface SpecValidationResult {
    valid: boolean;
    errors: SpecValidationError[];
    warnings: string[];
}
export declare function validateVariantSpecs(params: {
    fuel_type_name?: string;
    specs_normalized?: Record<string, any>;
    specs_raw?: Record<string, any>;
}): SpecValidationResult;
