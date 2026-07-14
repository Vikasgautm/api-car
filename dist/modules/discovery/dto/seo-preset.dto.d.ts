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
        success: boolean;
        error: {
            errors: {
                message: string;
            }[];
        };
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
        success: boolean;
        error: {
            errors: {
                message: string;
            }[];
        };
    };
}
