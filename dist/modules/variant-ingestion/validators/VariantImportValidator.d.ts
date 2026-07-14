import { ValidationIssue } from '../models/VariantImportStaging';
interface VariantInput {
    variant_name?: string;
    source_car_name?: string;
    price?: number;
    fuel_type?: string;
    transmission?: string;
    raw_specs?: Record<string, any>;
    normalized_specs?: Record<string, any>;
}
export declare class VariantImportValidator {
    static validate(input: VariantInput, validFuelTypeNames?: string[]): ValidationIssue[];
    private static validateSpecs;
    static hasErrors(issues: ValidationIssue[]): boolean;
}
export {};
