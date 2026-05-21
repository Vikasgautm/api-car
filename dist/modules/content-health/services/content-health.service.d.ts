import { HealthIssue, HealthSummary, IssueCategory, IssuesQueryParams, PaginatedIssuesResult } from '../dto/content-health.dto';
export declare class ContentHealthService {
    static getSummary(): Promise<HealthSummary>;
    static getIssues(params: IssuesQueryParams): Promise<PaginatedIssuesResult>;
    static getIssuesByCategory(category: IssueCategory, params: IssuesQueryParams): Promise<PaginatedIssuesResult>;
    static getEntityIssues(entityType: string, entityId: string): Promise<{
        issues: HealthIssue[];
        total: number;
        generated_at: string;
    }>;
}
//# sourceMappingURL=content-health.service.d.ts.map