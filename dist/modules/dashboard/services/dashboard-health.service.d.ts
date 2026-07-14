export interface ContentHealthSummary {
    missing_images: number;
    missing_seo: number;
    broken_slugs: number;
    orphan_variants: number;
    stale_lifecycle: number;
    low_confidence_specs: number;
    duplicate_slugs: number;
    total_issues: number;
}
export declare class DashboardHealthService {
    static getSummary(): Promise<ContentHealthSummary>;
}
