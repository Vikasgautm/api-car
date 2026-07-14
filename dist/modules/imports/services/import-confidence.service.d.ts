export interface ImportConfidenceScore {
    import_id: string;
    variant_id?: string;
    car_id?: string;
    overall_score: number;
    components: {
        match_quality_score: number;
        source_reliability_score: number;
        validation_score: number;
        coverage_score: number;
    };
    details: {
        total_fields: number;
        exact_matches: number;
        fuzzy_matches: number;
        unmatched: number;
        validation_errors: number;
        validation_warnings: number;
    };
    recommendation: 'auto_publish' | 'review_required' | 'needs_manual_work';
}
export declare class ImportConfidenceService {
    static scoreImport(import_id: string): Promise<ImportConfidenceScore>;
    static scoreVariantImports(variant_id: string): Promise<ImportConfidenceScore[]>;
    static scoreCarImports(car_id: string): Promise<ImportConfidenceScore[]>;
    static getBatchQualityReport(limit?: number): Promise<{
        avg_confidence: number;
        high_confidence: number;
        medium_confidence: number;
        low_confidence: number;
        recent_imports: ImportConfidenceScore[];
    }>;
    private static calculateValidationScore;
}
