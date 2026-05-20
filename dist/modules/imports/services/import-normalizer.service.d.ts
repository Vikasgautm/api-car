/**
 * Import Normalizer Service
 * Orchestrates normalization of raw imported specs_raw into clean specs_normalized
 *
 * Flow:
 * 1. Accepts specs_raw (messy imported data)
 * 2. Cleans strings (spaces, casing, punctuation)
 * 3. Normalizes booleans (yes/no/na → true/false/null)
 * 4. Maps semantic names (synonyms → canonical keys)
 * 5. Extracts numbers from formatted text ("60 kWh" → 60)
 * 6. Returns specs_normalized with confidence scores
 */
import { SpecsNormalized } from '../../../models/car-variant.model';
export interface NormalizationReport {
    specs_normalized: SpecsNormalized;
    normalization_stats: {
        total_fields_processed: number;
        mapped_fields: number;
        unmapped_fields: number;
        estimated_fields: number;
        overall_confidence: number;
    };
    unmapped_keys: Array<{
        key: string;
        raw_value: any;
        attempted_mapping: string;
    }>;
    mapping_details: Record<string, {
        original: any;
        normalized: any;
        confidence: number;
        is_estimated: boolean;
    }>;
}
export declare class ImportNormalizerService {
    /**
     * Normalize all specs from a raw import
     */
    static normalize(specs_raw?: Record<string, any>): NormalizationReport;
    /**
     * Normalize a single field
     * Returns: { success, value, confidence, is_estimated, path, canonical_key, attempted_mapping }
     */
    private static normalizeField;
    /**
     * Map raw key names to normalized field path
     * E.g. "engine_displacement_cc" → { category: "engine_performance", key: "displacement" }
     */
    private static mapRawKeyToNormalized;
    /**
     * Normalize a value based on its expected type
     */
    private static normalizeValueForType;
}
//# sourceMappingURL=import-normalizer.service.d.ts.map