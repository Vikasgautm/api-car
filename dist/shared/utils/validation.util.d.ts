export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
export declare class ValidationUtil {
    static required(value: unknown, fieldName: string): ValidationResult;
    static email(value: string): ValidationResult;
    static minLength(value: string, min: number, fieldName: string): ValidationResult;
    static maxLength(value: string, max: number, fieldName: string): ValidationResult;
    static min(value: number, min: number, fieldName: string): ValidationResult;
    static max(value: number, max: number, fieldName: string): ValidationResult;
    static enum(value: string, allowedValues: string[], fieldName: string): ValidationResult;
    static url(value: string): ValidationResult;
    static objectId(value: string): ValidationResult;
    static slug(value: string): ValidationResult;
    static pincode(value: string): ValidationResult;
    static latitude(value: number): ValidationResult;
    static longitude(value: number): ValidationResult;
    static combineResults(...results: ValidationResult[]): ValidationResult;
    static throwIfInvalid(result: ValidationResult): void;
}
