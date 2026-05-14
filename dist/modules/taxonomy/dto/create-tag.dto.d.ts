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
    static validate(dto: CreateTagDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=create-tag.dto.d.ts.map