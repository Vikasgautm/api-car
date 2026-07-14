import { z } from 'zod';
export declare class CreateTagCategoryDto {
    name: string;
    type: string;
    description?: string;
    is_published?: boolean;
    sort_order?: number;
    static validate(dto: any): z.ZodSafeParseResult<{
        name: string;
        type: string;
        description?: string | undefined;
        is_published?: boolean | undefined;
        sort_order?: number | undefined;
    }>;
}
export declare class UpdateTagCategoryDto {
    name?: string;
    type?: string;
    description?: string;
    is_published?: boolean;
    sort_order?: number;
    static validate(dto: any): z.ZodSafeParseResult<{
        name?: string | undefined;
        type?: string | undefined;
        description?: string | undefined;
        is_published?: boolean | undefined;
        sort_order?: number | undefined;
    }>;
}
export declare class CreateTagDto {
    tag_category_id: string;
    name: string;
    description?: string;
    seo_meta?: {
        title?: string;
        description?: string;
        h1?: string;
    };
    is_published?: boolean;
    sort_order?: number;
    static validate(dto: any): z.ZodSafeParseResult<{
        tag_category_id: string;
        name: string;
        description?: string | undefined;
        seo_meta?: {
            title?: string | undefined;
            description?: string | undefined;
            h1?: string | undefined;
        } | undefined;
        is_published?: boolean | undefined;
        sort_order?: number | undefined;
    }>;
}
export declare class UpdateTagDto {
    tag_category_id?: string;
    name?: string;
    description?: string;
    seo_meta?: {
        title?: string;
        description?: string;
        h1?: string;
    };
    is_published?: boolean;
    sort_order?: number;
    static validate(dto: any): z.ZodSafeParseResult<{
        tag_category_id?: string | undefined;
        name?: string | undefined;
        description?: string | undefined;
        seo_meta?: {
            title?: string | undefined;
            description?: string | undefined;
            h1?: string | undefined;
        } | undefined;
        is_published?: boolean | undefined;
        sort_order?: number | undefined;
    }>;
}
