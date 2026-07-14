export interface DashboardOverview {
    cars: {
        total: number;
        published: number;
        draft: number;
        upcoming: number;
        archived: number;
        discontinued: number;
    };
    total_variants: number;
    total_seo_collections: number;
    failed_imports: number;
    pending_ai_refinements: number;
    content_health_issues: number;
}
export declare class DashboardOverviewService {
    static getOverview(): Promise<DashboardOverview>;
}
