import { SourceType } from '../rules/source-priority-config';
export interface VariantSourceMetadata {
    variant_id: string;
    car_id: string;
    source_contribution: {
        source: SourceType;
        fields_contributed: string[];
        last_imported_at: Date;
        import_id: string;
    }[];
}
export declare class MultiSourceVariantService {
    /**
     * Consolidate specs from multiple import logs into a single high-quality variant.
     * Respects source priority for conflicts.
     */
    static consolidateFromMultipleSources(variant_id: string): Promise<{
        merged_specs: any;
        metadata: VariantSourceMetadata;
    }>;
    /**
     * Track which sources contributed which fields.
     */
    private static trackFieldContributions;
    /**
     * Apply consolidated specs to a variant while preserving source metadata.
     */
    static applyConsolidatedSpecs(variant_id: string, mergedSpecs: Record<string, any>): Promise<void>;
    /**
     * Get which sources have imported a variant.
     */
    static getSourceHistory(variant_id: string): Promise<SourceType[]>;
}
//# sourceMappingURL=multi-source-variant.service.d.ts.map