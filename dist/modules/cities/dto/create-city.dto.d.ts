export declare class CreateCityDto {
    name: string;
    slug?: string;
    state: string;
    pincode?: string;
    longitude?: number;
    latitude?: number;
    city_logo?: string;
    is_published?: boolean;
    is_featured?: boolean;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    og_image?: string;
    canonical_url?: string;
    noindex?: boolean;
    static validate(dto: CreateCityDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=create-city.dto.d.ts.map