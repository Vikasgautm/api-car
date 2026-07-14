export interface SeoSummary {
    total: number;
    published: number;
    draft: number;
    archived: number;
    weak: number;
    empty: number;
}
export declare class DashboardSeoService {
    static getSummary(): Promise<SeoSummary>;
}
