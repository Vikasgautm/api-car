export declare class CreateSeoPresetDto {
    slug: string;
    title: string;
    h1?: string;
    meta_description?: string;
    meta_keywords?: string;
    hero_intro?: string;
    query_params?: Record<string, string>;
    is_published?: boolean;
    sort_order?: number;
    static validate(dto: CreateSeoPresetDto): {
        valid: boolean;
        errors: string[];
    };
}
export declare class UpdateSeoPresetDto {
    slug?: string;
    title?: string;
    h1?: string;
    meta_description?: string;
    meta_keywords?: string;
    hero_intro?: string;
    query_params?: Record<string, string>;
    is_published?: boolean;
    sort_order?: number;
    static validate(dto: UpdateSeoPresetDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=seo-preset.dto.d.ts.map