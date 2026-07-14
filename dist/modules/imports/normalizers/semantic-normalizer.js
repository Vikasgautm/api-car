"use strict";
/**
 * Semantic Normalizer
 * Maps raw feature names (synonyms) to canonical CarSalahakar keys.
 * Uses semantic mapping registry to resolve variants like:
 *   "360 Camera" → camera_360
 *   "Wireless Phone Charging" → wireless_charger
 *   "Auto Climate Control" → automatic_climate_control
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticNormalizer = void 0;
const semantic_mappings_1 = require("../constants/semantic-mappings");
const string_normalizer_1 = require("./string-normalizer");
class SemanticNormalizer {
    static lookupTable = null;
    static getLookupTable() {
        if (!this.lookupTable) {
            this.lookupTable = (0, semantic_mappings_1.buildSemanticLookupTable)();
        }
        return this.lookupTable;
    }
    /**
     * Normalize a feature name to canonical key
     */
    static normalize(value) {
        if (!value) {
            return {
                original_value: '',
                canonical_key: null,
                canonical_label: null,
                category: null,
                is_mapped: false,
                confidence: 0,
                match_type: 'none',
            };
        }
        const stringValue = String(value);
        const lookupValue = string_normalizer_1.StringNormalizer.normalizeForLookup(stringValue);
        if (!lookupValue) {
            return {
                original_value: stringValue,
                canonical_key: null,
                canonical_label: null,
                category: null,
                is_mapped: false,
                confidence: 0,
                match_type: 'none',
            };
        }
        const lookupTable = this.getLookupTable();
        // Exact match
        if (lookupTable.has(lookupValue)) {
            const canonicalKey = lookupTable.get(lookupValue);
            const mapping = (0, semantic_mappings_1.getSemanticMapping)(canonicalKey);
            return {
                original_value: stringValue,
                canonical_key: canonicalKey,
                canonical_label: mapping.label,
                category: mapping.category,
                is_mapped: true,
                confidence: 1,
                match_type: 'exact',
            };
        }
        // Fuzzy match: try partial matches
        const fuzzyMatch = this.fuzzyMatch(lookupValue, lookupTable);
        if (fuzzyMatch) {
            const mapping = (0, semantic_mappings_1.getSemanticMapping)(fuzzyMatch);
            return {
                original_value: stringValue,
                canonical_key: fuzzyMatch,
                canonical_label: mapping.label,
                category: mapping.category,
                is_mapped: true,
                confidence: 0.8,
                match_type: 'fuzzy',
            };
        }
        // No match
        return {
            original_value: stringValue,
            canonical_key: null,
            canonical_label: null,
            category: null,
            is_mapped: false,
            confidence: 0,
            match_type: 'none',
        };
    }
    /**
     * Fuzzy match: try to find a mapping by substring matching
     */
    static fuzzyMatch(lookupValue, table) {
        const words = lookupValue.split(' ');
        // Try matching 2+ word combinations from the input
        for (let i = 0; i < words.length; i++) {
            for (let j = i + 1; j <= words.length; j++) {
                const substring = words.slice(i, j).join(' ');
                if (table.has(substring)) {
                    return table.get(substring);
                }
            }
        }
        // Try reverse: find a synonym that contains our words
        for (const [synonym, key] of table) {
            // If most words from input are in the synonym
            const matchingWords = words.filter(w => synonym.includes(w)).length;
            if (matchingWords >= Math.max(1, Math.ceil(words.length * 0.6))) {
                return key;
            }
        }
        return null;
    }
    /**
     * Batch normalize
     */
    static normalizeBatch(values) {
        return values.map(v => this.normalize(v));
    }
    /**
     * Get stats on mapping success rate
     */
    static getUnmappedFeature(value) {
        const result = this.normalize(value);
        return result.is_mapped ? null : result.original_value;
    }
}
exports.SemanticNormalizer = SemanticNormalizer;
