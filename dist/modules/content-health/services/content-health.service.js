"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentHealthService = void 0;
const health_cache_1 = require("./health-cache");
const image_health_checker_1 = require("./checkers/image-health.checker");
const import_health_checker_1 = require("./checkers/import-health.checker");
const publishing_health_checker_1 = require("./checkers/publishing-health.checker");
const seo_health_checker_1 = require("./checkers/seo-health.checker");
const taxonomy_health_checker_1 = require("./checkers/taxonomy-health.checker");
const url_health_checker_1 = require("./checkers/url-health.checker");
const variant_health_checker_1 = require("./checkers/variant-health.checker");
const faq_health_checker_1 = require("./checkers/faq-health.checker");
const CHECKERS = {
    seo_health: seo_health_checker_1.runSeoHealthChecker,
    variant_health: variant_health_checker_1.runVariantHealthChecker,
    image_health: image_health_checker_1.runImageHealthChecker,
    url_health: url_health_checker_1.runUrlHealthChecker,
    import_health: import_health_checker_1.runImportHealthChecker,
    taxonomy_health: taxonomy_health_checker_1.runTaxonomyHealthChecker,
    publishing_health: publishing_health_checker_1.runPublishingHealthChecker,
    faq_health: faq_health_checker_1.runFaqHealthChecker,
};
const CATEGORY_TO_CHECKER = {
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
async function runCheckerSafe(name, fn, params) {
    try {
        return await fn(params);
    }
    catch (err) {
        return { checker: name, issues: [], total: 0, error: err?.message || `Checker "${name}" failed` };
    }
}
function applyFilters(issues, params) {
    let result = issues;
    if (params.severity)
        result = result.filter((i) => i.severity === params.severity);
    if (params.category)
        result = result.filter((i) => i.category === params.category);
    if (params.entity_type)
        result = result.filter((i) => i.entity_type === params.entity_type);
    if (params.search) {
        const q = params.search.toLowerCase();
        result = result.filter((i) => i.entity_name.toLowerCase().includes(q) ||
            i.issue_title.toLowerCase().includes(q) ||
            i.issue_code.toLowerCase().includes(q));
    }
    return result;
}
class ContentHealthService {
    static async getSummary() {
        const cached = (0, health_cache_1.cacheGet)(SUMMARY_CACHE_KEY);
        if (cached) {
            return { ...cached, cache_hit: true };
        }
        const baseParams = { page: 1, limit: 500 };
        const checkerEntries = Object.entries(CHECKERS);
        const results = await Promise.all(checkerEntries.map(([name, fn]) => runCheckerSafe(name, fn, baseParams)));
        const allIssues = [];
        const checkersStatus = [];
        for (const result of results) {
            allIssues.push(...result.issues);
            checkersStatus.push({
                name: result.checker,
                status: result.error ? 'error' : 'ok',
                issue_count: result.total,
                ...(result.error ? { error: result.error } : {}),
            });
        }
        const byCategory = {};
        let critical = 0, high = 0, medium = 0, low = 0;
        for (const issue of allIssues) {
            byCategory[issue.category] = (byCategory[issue.category] ?? 0) + 1;
            if (issue.severity === 'critical')
                critical++;
            else if (issue.severity === 'high')
                high++;
            else if (issue.severity === 'medium')
                medium++;
            else if (issue.severity === 'low')
                low++;
        }
        const summary = {
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
        (0, health_cache_1.cacheSet)(SUMMARY_CACHE_KEY, summary, SUMMARY_TTL_MS);
        return summary;
    }
    static async getIssues(params) {
        const page = Math.max(1, params.page || 1);
        const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, params.limit || 20));
        const cacheKey = `health:issues:${params.category || 'all'}:${params.severity || 'all'}:${params.entity_type || 'all'}:${params.search || ''}:${page}:${limit}`;
        const cached = (0, health_cache_1.cacheGet)(cacheKey);
        if (cached) {
            return { ...cached, cache_hit: true };
        }
        let checkersToRun;
        if (params.category && CATEGORY_TO_CHECKER[params.category]) {
            const checkerName = CATEGORY_TO_CHECKER[params.category];
            checkersToRun = [[checkerName, CHECKERS[checkerName]]];
        }
        else {
            checkersToRun = Object.entries(CHECKERS);
        }
        const baseParams = { ...params, page: 1, limit: 500 };
        const results = await Promise.all(checkersToRun.map(([name, fn]) => runCheckerSafe(name, fn, baseParams)));
        let allIssues = results.flatMap((r) => r.issues);
        allIssues = applyFilters(allIssues, params);
        // Sort: critical first, then high, medium, low
        const ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
        allIssues.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
        const total = allIssues.length;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;
        const pageIssues = allIssues.slice(offset, offset + limit);
        const result = {
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
        (0, health_cache_1.cacheSet)(cacheKey, result, ISSUES_TTL_MS);
        return result;
    }
    static async getIssuesByCategory(category, params) {
        return ContentHealthService.getIssues({ ...params, category });
    }
    static async getEntityIssues(entityType, entityId) {
        const cacheKey = `health:entity:${entityType}:${entityId}`;
        const cached = (0, health_cache_1.cacheGet)(cacheKey);
        if (cached)
            return cached;
        const baseParams = { page: 1, limit: 500, entity_type: entityType };
        const results = await Promise.all(Object.entries(CHECKERS).map(([name, fn]) => runCheckerSafe(name, fn, baseParams)));
        const issues = results
            .flatMap((r) => r.issues)
            .filter((i) => i.entity_id === entityId);
        const result = { issues, total: issues.length, generated_at: new Date().toISOString() };
        (0, health_cache_1.cacheSet)(cacheKey, result, ISSUES_TTL_MS);
        return result;
    }
}
exports.ContentHealthService = ContentHealthService;
