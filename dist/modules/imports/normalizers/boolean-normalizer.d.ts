/**
 * Boolean Normalizer
 * Converts messy yes/no/na/— values to clean true/false/null
 */
export interface BooleanNormalizationResult {
    value: boolean | null;
    is_estimated: boolean;
    confidence: number;
    original_value: any;
}
export declare class BooleanNormalizer {
    private static readonly TRUE_PATTERNS;
    private static readonly FALSE_PATTERNS;
    /**
     * Normalize a value to boolean or null.
     * Returns null for empty/missing values (not estimated as false).
     */
    static normalize(value: any): BooleanNormalizationResult;
    /**
     * Batch normalize an array of values
     */
    static normalizeBatch(values: any[]): BooleanNormalizationResult[];
}
//# sourceMappingURL=boolean-normalizer.d.ts.map