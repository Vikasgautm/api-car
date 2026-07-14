export interface GlobalSearchResult {
    type: 'car' | 'variant' | 'seo_collection' | 'comparison' | 'blog';
    id: string;
    title: string;
    subtitle?: string;
    link: string;
}
export interface GlobalSearchResponse {
    cars: GlobalSearchResult[];
    variants: GlobalSearchResult[];
    seo_collections: GlobalSearchResult[];
    comparisons: GlobalSearchResult[];
    blogs: GlobalSearchResult[];
    total: number;
}
export declare class DashboardSearchService {
    static search(query: string, limit?: number): Promise<GlobalSearchResponse>;
}
