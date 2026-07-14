/**
 * String Normalizer
 * Cleans spaces, casing, special characters
 */
export interface StringNormalizationResult {
    value: string;
    is_valid: boolean;
    confidence: number;
    original_value: string;
    changes_made: string[];
}
export declare class StringNormalizer {
    /**
     * Normalize a string: lowercase, trim, collapse spaces, remove extra punctuation
     */
    static normalize(value: any, options?: {
        preserve_case?: boolean;
    }): StringNormalizationResult;
    /**
     * Normalize for dictionary/semantic lookup: very aggressive
     */
    static normalizeForLookup(value: any): string;
    /**
     * Extract numeric value from text: "60 kWh" → 60
     */
    static extractNumeric(value: any): number | null;
}
