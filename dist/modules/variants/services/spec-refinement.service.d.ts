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
export interface MissingFieldSuggestion {
    field: string;
    label: string;
    location: 'top' | 'spec';
    type: 'number' | 'string' | 'boolean';
    unit?: string;
    suggested_value: any;
    reason: string;
    confidence: number;
}
export interface MissingFieldsResult {
    variant_id: string;
    variant_name: string;
    fields: MissingFieldSuggestion[];
    generated_at: string;
}
export declare class SpecRefinementService {
    private static client;
    private static getClient;
    static refineVariantSpecs(variantId: string): Promise<SpecRefinementResult>;
    private static performRefinement;
    private static buildRefinementPrompt;
    private static identifyMissingFields;
    private static identifyLowQualityFields;
    private static parseRefinementResponse;
    static applyRefinementSuggestions(variantId: string, suggestions: SpecRefinementSuggestion[]): Promise<any>;
    /**
     * Identify the fields validation flags as missing (intersected with the
     * registry of AI-fillable fields), then ask the AI to suggest a value for
     * each so the admin can verify and one-click save into the DB.
     */
    static suggestMissingFields(variantId: string): Promise<MissingFieldsResult>;
    private static buildMissingFieldsPrompt;
    private static parseMissingFieldsResponse;
    /**
     * Apply admin-verified values for missing fields. Routes the write through
     * CarVariantService.updateVariant so audit + change-history are recorded.
     */
    static applyMissingFieldValues(variantId: string, values: Array<{
        field: string;
        value: any;
    }>, actor?: any): Promise<any>;
    private static setNestedValue;
    static refineMultipleVariants(variantIds: string[]): Promise<SpecRefinementResult[]>;
}
