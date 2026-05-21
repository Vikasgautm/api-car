interface HealthInput {
    collection_id?: string;
    matched_car_count: number;
    seo?: {
        h1?: string | null;
        meta_title?: string | null;
        meta_description?: string | null;
        intro_content?: string | null;
    };
    faq_items?: Array<any>;
    slug?: string;
    fuel_type_ids?: string[];
    body_type_ids?: string[];
    budget_min?: number | null;
    budget_max?: number | null;
}
interface HealthResult {
    health_score: number;
    duplicate_risk_score: number;
    auto_noindex: boolean;
    seo_index_status: 'index' | 'noindex';
}
export declare class SeoCollectionHealthService {
    static computeHealth(input: HealthInput): Promise<HealthResult>;
    static refreshCollection(collection_id: string): Promise<void>;
}
export {};
//# sourceMappingURL=seo-collection-health.service.d.ts.map