export interface SEOMetadata {
    title: string;
    description: string;
    keywords?: string[];
    canonical?: string;
    ogImage?: string;
}
export declare const generateCarMetadata: (car: any) => SEOMetadata;
export declare const generateBlogMetadata: (blog: any) => SEOMetadata;
//# sourceMappingURL=seo.d.ts.map