export interface UnmatchedKeyFrequency {
    key: string;
    count: number;
    sources: {
        source: string;
        count: number;
    }[];
    sample_values: string[];
}
export interface UnmatchedKeysAnalyticsResult {
    total_imports: number;
    imports_with_unmatched: number;
    total_unique_unmatched_keys: number;
    frequency_by_key: UnmatchedKeyFrequency[];
}
export declare class UnmatchedKeysAnalyticsService {
    static getUnmatchedKeyFrequency(limit?: number): Promise<UnmatchedKeysAnalyticsResult>;
    static getFrequencyBySource(source: string, limit?: number): Promise<UnmatchedKeyFrequency[]>;
    static getFrequencyByImportType(importType: 'car' | 'variant', limit?: number): Promise<UnmatchedKeyFrequency[]>;
    private static normalizeKey;
}
