/**
 * Semantic Mapping Registry
 * Maps raw imported feature names (synonyms) to canonical CarSalahakar keys.
 * Enables clean normalization of messy automotive data from multiple sources.
 *
 * Structure:
 * - key: canonical CarSalahakar field key (e.g., "wireless_charger")
 * - category: spec section (engine_performance, battery_charging, etc.)
 * - synonyms: array of imported values that should normalize to this key
 */
export interface SemanticMapping {
    key: string;
    category: string;
    label: string;
    synonyms: string[];
    confidence_boost?: number;
}
export declare const SEMANTIC_MAPPINGS: SemanticMapping[];
/**
 * Build a fast lookup table: normalized_synonym → canonical_key
 */
export declare function buildSemanticLookupTable(): Map<string, string>;
/**
 * Get a mapping by canonical key
 */
export declare function getSemanticMapping(key: string): SemanticMapping | undefined;
/**
 * Get all mappings for a category
 */
export declare function getSemanticMappingsByCategory(category: string): SemanticMapping[];
//# sourceMappingURL=semantic-mappings.d.ts.map