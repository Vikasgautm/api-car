export declare class UpdateBodyTypeDto {
    name?: string;
    description?: string;
    seo_title?: string;
    meta_description?: string;
    intro_content?: string;
    short_description?: string;
    is_published?: boolean;
    is_featured?: boolean;
    logo_url?: string;
    logo_title?: string;
    hero_image_url?: string;
    hero_image_alt?: string;
    sort_order?: number;
    parent_id?: string;
    related_body_types?: string[];
    updated_by?: string;
    static validate(dto: UpdateBodyTypeDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=update-body-type.dto.d.ts.map