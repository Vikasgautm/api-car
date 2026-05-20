/**
 * Semantic Normalizer
 * Maps raw feature names (synonyms) to canonical CarSalahakar keys.
 * Uses semantic mapping registry to resolve variants like:
 *   "360 Camera" → camera_360
 *   "Wireless Phone Charging" → wireless_charger
 *   "Auto Climate Control" → automatic_climate_control
 */

import { buildSemanticLookupTable, getSemanticMapping } from '../constants/semantic-mappings';
import { StringNormalizer } from './string-normalizer';

export interface SemanticNormalizationResult {
  original_value: string;
  canonical_key: string | null;
  canonical_label: string | null;
  category: string | null;
  is_mapped: boolean;
  confidence: number; // 0-1
  match_type: 'exact' | 'fuzzy' | 'none';
}

export class SemanticNormalizer {
  private static lookupTable: Map<string, string> | null = null;

  private static getLookupTable(): Map<string, string> {
    if (!this.lookupTable) {
      this.lookupTable = buildSemanticLookupTable();
    }
    return this.lookupTable;
  }

  /**
   * Normalize a feature name to canonical key
   */
  static normalize(value: any): SemanticNormalizationResult {
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
    const lookupValue = StringNormalizer.normalizeForLookup(stringValue);

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
      const canonicalKey = lookupTable.get(lookupValue)!;
      const mapping = getSemanticMapping(canonicalKey)!;

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
      const mapping = getSemanticMapping(fuzzyMatch)!;

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
  private static fuzzyMatch(lookupValue: string, table: Map<string, string>): string | null {
    const words = lookupValue.split(' ');

    // Try matching 2+ word combinations from the input
    for (let i = 0; i < words.length; i++) {
      for (let j = i + 1; j <= words.length; j++) {
        const substring = words.slice(i, j).join(' ');
        if (table.has(substring)) {
          return table.get(substring)!;
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
  static normalizeBatch(values: any[]): SemanticNormalizationResult[] {
    return values.map(v => this.normalize(v));
  }

  /**
   * Get stats on mapping success rate
   */
  static getUnmappedFeature(value: any): string | null {
    const result = this.normalize(value);
    return result.is_mapped ? null : result.original_value;
  }
}
