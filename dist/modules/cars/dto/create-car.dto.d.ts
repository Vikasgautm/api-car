export declare class CreateCarDto {
    name: string;
    slug?: string;
    brand_id: string;
    body_type_id: string;
    fuel_type_id?: string;
    short_description?: string;
    description: string;
    thumbnail_url?: string;
    thumbnail_alt?: string;
    gallery?: Array<{
        url: string;
        alt?: string;
    }>;
    gallery_summary?: string;
    status?: 'upcoming' | 'launched' | 'discontinued';
    is_upcoming?: boolean;
    is_launched?: boolean;
    expected_exshowroom_price?: number;
    expected_launch_date?: string;
    exshowroom_price?: number;
    launch_date?: string;
    is_electric?: boolean;
    is_published?: boolean;
    is_featured?: boolean;
    is_popular?: boolean;
    is_recommended?: boolean;
    is_latest?: boolean;
    top_selling?: boolean;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    og_image?: string;
    canonical_url?: string;
    noindex?: boolean;
    static validate(dto: CreateCarDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=create-car.dto.d.ts.map