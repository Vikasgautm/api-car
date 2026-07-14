export interface VariantDifference {
    variant_id: string;
    adds_over_lower_variant?: string[];
    missing_from_higher_variant?: string[];
}
export declare class DifferenceEngineService {
    /**
     * For a given variant, calculate what features it adds compared to the next cheaper variant,
     * and what features it's missing compared to the next more expensive variant.
     *
     * Only considers variants of the same car model for comparison.
     */
    static calculateVariantDifference(variantId: string): Promise<VariantDifference>;
    private static calculateDifferenceWithVariants;
    /**
     * Compare two variants and return features that are in variant B but not in variant A.
     */
    private static getFeatureDifferences;
    /**
     * Check if a feature value indicates the feature is present.
     */
    private static isFeaturePresent;
    /**
     * Get nested value from object using dot notation.
     */
    private static getNestedValue;
    /**
     * Batch calculate differences for all variants of a car model.
     */
    static calculateCarVariantDifferences(carId: string): Promise<VariantDifference[]>;
}
