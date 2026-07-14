export interface FeatureAvailability {
    feature_key: string;
    feature_label: string;
    variant_count: number;
    car_count: number;
    brand_count: number;
    slug: string;
    suggested_title: string;
    suggested_h1: string;
    suggested_meta_description: string;
}
export declare class SeoFilterGeneratorService {
    /**
     * Scan all published variants and collect feature availability statistics.
     * Returns a list of all detected features with their popularity.
     */
    static generateFeatureAvailability(): Promise<FeatureAvailability[]>;
    /**
     * Get nested value from object using dot notation path.
     */
    private static getNestedValue;
    /**
     * Auto-generate SEO presets for all features with at least N variants.
     * Only creates presets that don't already exist.
     */
    static autoGeneratePresets(minVariantCount?: number): Promise<{
        total_features: number;
        presets_created: number;
        created_presets: import("../../../models/seo-preset.model").ISeoPreset[];
        all_features: FeatureAvailability[];
    }>;
    /**
     * Return all available features across all variants.
     * Used by the admin UI to populate feature availability checklist.
     */
    static getAllFeatures(): Promise<FeatureAvailability[]>;
}
