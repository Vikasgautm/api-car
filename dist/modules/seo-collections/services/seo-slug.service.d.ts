export declare class SeoSlugService {
    static generate(params: {
        collection_type: string;
        fuel_type_ids?: string[];
        body_type_ids?: string[];
        brand_ids?: string[];
        transmission_types?: string[];
        budget_max?: number | null;
        budget_min?: number | null;
        seating_capacities?: number[];
        mileage_classes?: string[];
        feature_flags?: string[];
    }): Promise<string>;
    static ensureUnique(baseSlug: string, excludeId?: string): Promise<string>;
}
//# sourceMappingURL=seo-slug.service.d.ts.map