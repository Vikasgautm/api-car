export interface CompletenessMetric {
    variant_id: string;
    variant_name: string;
    overall_score: number;
    basic_info_score: number;
    specs_score: number;
    seo_score: number;
    pricing_score: number;
    status_score: number;
    missing_sections: string[];
    empty_sections: string[];
    recommendation: string;
}
export interface CarCompletenessReport {
    car_id: string;
    car_name: string;
    avg_completeness: number;
    total_variants: number;
    variants_by_score: Record<string, number>;
    critical_gaps: string[];
    metrics: CompletenessMetric[];
}
export declare class VariantCompletenessService {
    static getVariantCompleteness(variantId: string): Promise<CompletenessMetric>;
    private static scoreVariant;
    static getCarCompleteness(carId: string): Promise<CarCompletenessReport>;
    private static scoreBasicInfo;
    private static scoreSpecs;
    private static scoreSeo;
    private static scorePricing;
    private static scoreStatus;
    private static getMissingFields;
    private static getEmptySections;
    private static generateRecommendation;
}
