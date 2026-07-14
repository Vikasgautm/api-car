import { SpecsNormalized } from '../../../models/car-variant.model';
import { ExtractedSpec, MatchedSpec, UnmatchedSpec } from '../types/import.types';
export declare class KeyMatcher {
    private static specKeyCache;
    private static cacheExpiry;
    private static readonly CACHE_DURATION;
    private static slugify;
    private static calculateSimilarity;
    private static levenshteinDistance;
    private static loadSpecKeys;
    static matchSpecs(extractedSpecs: ExtractedSpec[]): Promise<{
        matched: MatchedSpec[];
        unmatched: UnmatchedSpec[];
    }>;
    private static mapToSpecPath;
    private static toCamelCase;
    private static parseValueByDataType;
    static mapMatchedSpecsToSpecsNormalized(matchedSpecs: MatchedSpec[]): {
        specs_normalized: Partial<SpecsNormalized>;
        specs_raw: Record<string, any>;
    };
    static clearCache(): void;
}
