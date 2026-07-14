/**
 * Semantic Normalizer
 * Maps raw feature names (synonyms) to canonical CarSalahakar keys.
 * Uses semantic mapping registry to resolve variants like:
 *   "360 Camera" → camera_360
 *   "Wireless Phone Charging" → wireless_charger
 *   "Auto Climate Control" → automatic_climate_control
 */
export interface SemanticNormalizationResult {
    original_value: string;
    canonical_key: string | null;
    canonical_label: string | null;
    category: string | null;
    is_mapped: boolean;
    confidence: number;
    match_type: 'exact' | 'fuzzy' | 'none';
}
export declare class SemanticNormalizer {
    private static lookupTable;
    private static getLookupTable;
    /**
     * Normalize a feature name to canonical key
     */
    static normalize(value: any): SemanticNormalizationResult;
    /**
     * Fuzzy match: try to find a mapping by substring matching
     */
    private static fuzzyMatch;
    /**
     * Batch normalize
     */
    static normalizeBatch(values: any[]): SemanticNormalizationResult[];
    /**
     * Get stats on mapping success rate
     */
    static getUnmappedFeature(value: any): string | null;
}
