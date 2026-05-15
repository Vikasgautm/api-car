export type SeoIssue = 'Missing Meta' | 'Weak Content' | 'Missing FAQ' | 'Missing Images';
export type CompletenessKey = 'description' | 'variants' | 'images' | 'thumbnail' | 'faq' | 'meta' | 'fuel_types' | 'body_type' | 'pricing';
export type CompletenessSeverity = 'missing' | 'weak';
export interface CompletenessMiss {
    key: CompletenessKey;
    label: string;
    severity: CompletenessSeverity;
}
export interface CarHealth {
    seo_health_issues: SeoIssue[];
    completeness_score: number;
    completeness_misses: CompletenessMiss[];
}
export interface CarHealthInput {
    car_id: string;
    description?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    thumbnail?: {
        url?: string | null;
    } | null;
    images?: Array<unknown> | null;
    body_type_id?: string | null;
    variant_count?: number | null;
    aggregated_fuel_types?: string[] | null;
    min_variant_price?: number | null;
    max_variant_price?: number | null;
    expected_exshowroom_price?: number | null;
    exshowroom_price?: number | null;
}
export declare class CarHealthService {
    static getFaqCountsByCar(carIds: string[]): Promise<Map<string, number>>;
    static compute(car: CarHealthInput, faqCount: number): CarHealth;
}
//# sourceMappingURL=car-health.service.d.ts.map