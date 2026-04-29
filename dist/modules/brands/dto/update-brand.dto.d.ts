export declare class UpdateBrandDto {
    name?: string;
    slug?: string;
    description?: string;
    logo_url?: string;
    logo_title?: string;
    is_published?: boolean;
    is_featured?: boolean;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    og_image?: string;
    canonical_url?: string;
    noindex?: boolean;
    static validate(dto: UpdateBrandDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=update-brand.dto.d.ts.map