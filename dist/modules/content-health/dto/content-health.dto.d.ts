export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IssueCategory = 'seo_health' | 'variant_health' | 'image_health' | 'url_health' | 'import_health' | 'taxonomy_health' | 'schema_readiness' | 'publishing_health' | 'content_quality' | 'faq_health';
export interface HealthIssue {
    id: string;
    category: IssueCategory;
    severity: IssueSeverity;
    entity_type: string;
    entity_id: string;
    entity_name: string;
    issue_code: string;
    issue_title: string;
    issue_description: string;
    recommendation: string;
    edit_url: string;
    detected_at: string;
}
export interface CheckerResult {
    checker: string;
    issues: HealthIssue[];
    total: number;
    error?: string;
}
export interface CheckerStatus {
    name: string;
    status: 'ok' | 'error';
    issue_count: number;
    error?: string;
}
export interface HealthSummary {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    by_category: Record<string, number>;
    checkers_status: CheckerStatus[];
    generated_at: string;
    cache_hit: boolean;
}
export interface IssuesQueryParams {
    page: number;
    limit: number;
    severity?: IssueSeverity;
    category?: IssueCategory;
    entity_type?: string;
    search?: string;
}
export interface PaginatedIssuesResult {
    issues: HealthIssue[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    generated_at: string;
    cache_hit: boolean;
}
