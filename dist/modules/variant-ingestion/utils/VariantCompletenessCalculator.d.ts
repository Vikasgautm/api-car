interface CompletenessInput {
    normalized_specs?: Record<string, any>;
    raw_specs?: Record<string, any>;
    price?: number;
    fuel_type?: string;
    transmission?: string;
    variant_name?: string;
    has_images?: boolean;
    image_count?: number;
    has_meta_title?: boolean;
    has_meta_description?: boolean;
    has_faqs?: boolean;
    has_description?: boolean;
    has_feature_mapping?: boolean;
}
export interface CompletenessResult {
    score: number;
    breakdown: {
        specs: number;
        images: number;
        seo: number;
        faqs: number;
        descriptions: number;
        feature_mapping: number;
    };
    missing_flags: string[];
}
export declare class VariantCompletenessCalculator {
    static calculate(input: CompletenessInput): CompletenessResult;
}
export {};
