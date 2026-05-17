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
     * Standardize a transmission type to valid TransmissionType enum.
     */
    static standardizeTransmissionType(value: string): EnumStandardizationResult;
    /**
     * Standardize all enum fields in a variant payload.
     */
    static standardizeVariantEnums(variantData: Record<string, any>): Promise<Record<string, EnumStandardizationResult>>;
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