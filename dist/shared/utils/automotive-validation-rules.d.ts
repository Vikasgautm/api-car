export interface ValidationRule {
    name: string;
    description: string;
    severity: 'error' | 'warning';
    validate: (variant: Record<string, any>) => boolean;
    errorMessage: (variant: Record<string, any>) => string;
}
export declare class AutomotiveValidationRules {
    static readonly rules: ValidationRule[];
    static validate(variant: Record<string, any>): Array<{
        rule: string;
        message: string;
        severity: 'error' | 'warning';
    }>;
    static validateStrict(variant: Record<string, any>): {
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
}
