export declare class CreateBlogDto {
    title: string;
    content: string;
    excerpt?: string;
    author_name?: string;
    author_id?: string;
    category: string;
    tags?: string[];
    thumbnail_url?: string;
    thumbnail_alt?: string;
    images?: Array<{
        url: string;
        alt?: string;
    }>;
    link?: string;
    is_published?: boolean;
    is_featured?: boolean;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    og_image?: string;
    canonical_url?: string;
    noindex?: boolean;
    article_type?: string;
    article_status?: string;
    article_intent?: string;
    target_keyword?: string;
    connected_cars?: string[];
    connected_variants?: string[];
    connected_brands?: string[];
    connected_body_types?: string[];
    connected_fuel_types?: string[];
    connected_comparisons?: string[];
    connected_collections?: string[];
    static validate(dto: CreateBlogDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=create-blog.dto.d.ts.map