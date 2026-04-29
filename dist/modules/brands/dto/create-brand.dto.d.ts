export declare class CreateBrandDto {
    name: string;
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
    static validate(dto: CreateBrandDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=create-brand.dto.d.ts.map