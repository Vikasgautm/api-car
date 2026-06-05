export interface EnumStandardizationResult {
    field: string;
    original_value: string;
    standardized_value: string | null;
    matched_id: string | null;
    confidence: number;
}
export declare class EnumStandardizerService {
    /**
     * Standardize a body type string to a valid BodyType ID.
     */
    static standardizeBodyType(value: string): Promise<EnumStandardizationResult>;
    /**
     * Standardize a fuel type string to a valid FuelType ID.
     */
    static standardizeFuelType(value: string): Promise<EnumStandardizationResult>;
    /**
     * Resolve a single-value field against the master data DB.
     * Logs unknown values for admin review. Falls back to 'other'.
     */
    static standardizeMasterField(field: string, categoryKey: string, rawValue: string, context?: string): Promise<EnumStandardizationResult>;
    /**
     * Resolve a multi-value field against the master data DB.
     * Each unmatched value is logged. Unknown values map to 'other'.
     */
    static standardizeMasterMultiField(field: string, categoryKey: string, rawValue: any, context?: string): Promise<string[]>;
    /**
     * Standardize all enum fields in a variant payload.
     */
    static standardizeVariantEnums(variantData: Record<string, any>, context?: string): Promise<Record<string, EnumStandardizationResult>>;
    /**
     * Normalize all master-data multi-select fields in a variant payload.
     * Returns resolved string arrays keyed by field name.
     */
    static standardizeVariantMultiFields(variantData: Record<string, any>, context?: string): Promise<Record<string, string[]>>;
    /**
     * Get standardization report for recent imports.
     */
    static getStandardizationReport(limit?: number): Promise<{
        total_checked: number;
        standardization_rate: number;
        by_field: Record<string, {
            total: number;
            standardized: number;
            rate: number;
        }>;
    }>;
}
//# sourceMappingURL=enum-standardizer.service.d.ts.map