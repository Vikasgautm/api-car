export type SourceType = 'cardekho' | 'carwale' | 'oem_brochure' | 'official_website';
export interface SourcePriority {
    source: SourceType;
    priority: number;
    category: 'aggregator' | 'official' | 'user';
}
export interface FieldSourceTrust {
    field: string;
    trusted_sources: SourceType[];
}
export declare const SOURCE_PRIORITIES: SourcePriority[];
export declare const FIELD_SOURCE_TRUST: FieldSourceTrust[];
export declare class SourcePriorityEngine {
    static getPriorityForSource(source: SourceType): number;
    static getHighestPrioritySource(...sources: SourceType[]): SourceType;
    static shouldUseSourceForField(source: SourceType, field: string): boolean;
    static getTrustedSourcesForField(field: string): SourceType[];
    static mergeSpecsFromMultipleSources(specsBySource: Map<SourceType, Record<string, any>>): Record<string, any>;
    private static deepMergeSpecs;
}
//# sourceMappingURL=source-priority-config.d.ts.map