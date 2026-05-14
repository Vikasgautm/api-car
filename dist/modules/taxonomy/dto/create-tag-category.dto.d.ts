export declare class CreateTagCategoryDto {
    name: string;
    type: string;
    description?: string;
    is_published?: boolean;
    sort_order?: number;
    static validate(dto: CreateTagCategoryDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=create-tag-category.dto.d.ts.map