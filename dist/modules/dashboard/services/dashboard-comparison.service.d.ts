export interface ComparisonSummary {
    total: number;
    published: number;
    draft: number;
    cars_without_comparisons: number;
    recent_updated: number;
}
export declare class DashboardComparisonService {
    static getSummary(): Promise<ComparisonSummary>;
}
