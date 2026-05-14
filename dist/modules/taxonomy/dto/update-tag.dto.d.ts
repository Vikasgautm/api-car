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
    static validate(dto: UpdateTagDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=update-tag.dto.d.ts.map