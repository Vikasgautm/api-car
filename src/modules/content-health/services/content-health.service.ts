import {
  CheckerResult,
  CheckerStatus,
  HealthIssue,
  HealthSummary,
  IssueCategory,
  IssueSeverity,
  IssuesQueryParams,
  PaginatedIssuesResult,
} from '../dto/content-health.dto';
import { cacheGet, cacheSet } from './health-cache';
import { runImageHealthChecker } from './checkers/image-health.checker';
import { runImportHealthChecker } from './checkers/import-health.checker';
import { runPublishingHealthChecker } from './checkers/publishing-health.checker';
import { runSeoHealthChecker } from './checkers/seo-health.checker';
import { runTaxonomyHealthChecker } from './checkers/taxonomy-health.checker';
import { runUrlHealthChecker } from './checkers/url-health.checker';
import { runVariantHealthChecker } from './checkers/variant-health.checker';
import { runFaqHealthChecker } from './checkers/faq-health.checker';

type CheckerFn = (params: IssuesQueryParams) => Promise<CheckerResult>;

const CHECKERS: Record<string, CheckerFn> = {
  seo_health: runSeoHealthChecker,
  variant_health: runVariantHealthChecker,
  image_health: runImageHealthChecker,
  url_health: runUrlHealthChecker,
  import_health: runImportHealthChecker,
  taxonomy_health: runTaxonomyHealthChecker,
  publishing_health: runPublishingHealthChecker,
  faq_health: runFaqHealthChecker,
};

const CATEGORY_TO_CHECKER: Record<IssueCategory, string> = {
  seo_health: 'seo_health',
  variant_health: 'variant_health',
  image_health: 'image_health',
  url_health: 'url_health',
  import_health: 'import_health',
  taxonomy_health: 'taxonomy_health',
  schema_readiness: 'seo_health',
  publishing_health: 'publishing_health',
  content_quality: 'seo_health',
  faq_health: 'faq_health',
};

const MAX_PAGE_SIZE = 100;
const SUMMARY_CACHE_KEY = 'health:summary';
const SUMMARY_TTL_MS = 5 * 60 * 1000;
const ISSUES_TTL_MS = 2 * 60 * 1000;

async function runCheckerSafe(name: string, fn: CheckerFn, params: IssuesQueryParams): Promise<CheckerResult> {
  try {
    return await fn(params);
  } catch (err: any) {
    return { checker: name, issues: [], total: 0, error: err?.message || `Checker "${name}" failed` };
  }
}

function applyFilters(
  issues: HealthIssue[],
  params: IssuesQueryParams,
): HealthIssue[] {
  let result = issues;
  if (params.severity) result = result.filter((i) => i.severity === params.severity);
  if (params.category) result = result.filter((i) => i.category === params.category);
  if (params.entity_type) result = result.filter((i) => i.entity_type === params.entity_type);
  if (params.search) {
    const q = params.search.toLowerCase();
    result = result.filter(
      (i) =>
        i.entity_name.toLowerCase().includes(q) ||
        i.issue_title.toLowerCase().includes(q) ||
        i.issue_code.toLowerCase().includes(q),
    );
  }
  return result;
}

export class ContentHealthService {
  static async getSummary(): Promise<HealthSummary> {
    const cached = cacheGet(SUMMARY_CACHE_KEY);
    if (cached) {
      return { ...(cached as HealthSummary), cache_hit: true };
    }

    const baseParams: IssuesQueryParams = { page: 1, limit: 500 };
    const checkerEntries = Object.entries(CHECKERS);

    const results = await Promise.all(
      checkerEntries.map(([name, fn]) => runCheckerSafe(name, fn, baseParams)),
    );

    const allIssues: HealthIssue[] = [];
    const checkersStatus: CheckerStatus[] = [];

    for (const result of results) {
      allIssues.push(...result.issues);
      checkersStatus.push({
        name: result.checker,
        status: result.error ? 'error' : 'ok',
        issue_count: result.total,
        ...(result.error ? { error: result.error } : {}),
      });
    }

    const byCategory: Record<string, number> = {};
    let critical = 0, high = 0, medium = 0, low = 0;

    for (const issue of allIssues) {
      byCategory[issue.category] = (byCategory[issue.category] ?? 0) + 1;
      if (issue.severity === 'critical') critical++;
      else if (issue.severity === 'high') high++;
      else if (issue.severity === 'medium') medium++;
      else if (issue.severity === 'low') low++;
    }

    const summary: HealthSummary = {
      total: allIssues.length,
      critical,
      high,
      medium,
      low,
      by_category: byCategory,
      checkers_status: checkersStatus,
      generated_at: new Date().toISOString(),
      cache_hit: false,
    };

    cacheSet(SUMMARY_CACHE_KEY, summary, SUMMARY_TTL_MS);
    return summary;
  }

  static async getIssues(params: IssuesQueryParams): Promise<PaginatedIssuesResult> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, params.limit || 20));
    const cacheKey = `health:issues:${params.category || 'all'}:${params.severity || 'all'}:${params.entity_type || 'all'}:${params.search || ''}:${page}:${limit}`;

    const cached = cacheGet(cacheKey);
    if (cached) {
      return { ...(cached as PaginatedIssuesResult), cache_hit: true };
    }

    let checkersToRun: [string, CheckerFn][];

    if (params.category && CATEGORY_TO_CHECKER[params.category]) {
      const checkerName = CATEGORY_TO_CHECKER[params.category];
      checkersToRun = [[checkerName, CHECKERS[checkerName]]];
    } else {
      checkersToRun = Object.entries(CHECKERS);
    }

    const baseParams: IssuesQueryParams = { ...params, page: 1, limit: 500 };
    const results = await Promise.all(
      checkersToRun.map(([name, fn]) => runCheckerSafe(name, fn, baseParams)),
    );

    let allIssues: HealthIssue[] = results.flatMap((r) => r.issues);
    allIssues = applyFilters(allIssues, params);

    // Sort: critical first, then high, medium, low
    const ORDER: Record<IssueSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    allIssues.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);

    const total = allIssues.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const pageIssues = allIssues.slice(offset, offset + limit);

    const result: PaginatedIssuesResult = {
      issues: pageIssues,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      generated_at: new Date().toISOString(),
      cache_hit: false,
    };

    cacheSet(cacheKey, result, ISSUES_TTL_MS);
    return result;
  }

  static async getIssuesByCategory(
    category: IssueCategory,
    params: IssuesQueryParams,
  ): Promise<PaginatedIssuesResult> {
    return ContentHealthService.getIssues({ ...params, category });
  }

  static async getEntityIssues(
    entityType: string,
    entityId: string,
  ): Promise<{ issues: HealthIssue[]; total: number; generated_at: string }> {
    const cacheKey = `health:entity:${entityType}:${entityId}`;
    const cached = cacheGet(cacheKey);
    if (cached) return cached as { issues: HealthIssue[]; total: number; generated_at: string };

    const baseParams: IssuesQueryParams = { page: 1, limit: 500, entity_type: entityType };
    const results = await Promise.all(
      Object.entries(CHECKERS).map(([name, fn]) => runCheckerSafe(name, fn, baseParams)),
    );

    const issues = results
      .flatMap((r) => r.issues)
      .filter((i) => i.entity_id === entityId);

    const result = { issues, total: issues.length, generated_at: new Date().toISOString() };
    cacheSet(cacheKey, result, ISSUES_TTL_MS);
    return result;
  }
}
