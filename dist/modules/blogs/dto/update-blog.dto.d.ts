export declare class UpdateBlogDto {
    title?: string;
    content?: string;
    excerpt?: string;
    author_name?: string;
    author_id?: string;
    category?: string;
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
    static validate(dto: UpdateBlogDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=update-blog.dto.d.ts.map