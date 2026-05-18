export interface SpecRefinementSuggestion {
    field: string;
    current_value: any;
    suggested_value: any;
    reason: string;
    confidence: number;
}
export interface SpecRefinementResult {
    variant_id: string;
    variant_name: string;
    suggestions: SpecRefinementSuggestion[];
    generated_at: string;
}
export declare class SpecRefinementService {
    private static client;
    static refineVariantSpecs(variantId: string): Promise<SpecRefinementResult>;
    private static performRefinement;
    private static buildRefinementPrompt;
    private static identifyMissingFields;
    private static identifyLowQualityFields;
    private static parseRefinementResponse;
    static applyRefinementSuggestions(variantId: string, suggestions: SpecRefinementSuggestion[]): Promise<any>;
    static refineMultipleVariants(variantIds: string[]): Promise<SpecRefinementResult[]>;
}
//# sourceMappingURL=spec-refinement.service.d.ts.map