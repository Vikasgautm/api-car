"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentHealthController = void 0;
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const content_health_service_1 = require("../services/content-health.service");
const MAX_LIMIT = 100;
function parseQueryParams(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || 20));
    const validSeverities = ['critical', 'high', 'medium', 'low'];
    const validCategories = [
        'seo_health', 'variant_health', 'image_health', 'url_health',
        'import_health', 'taxonomy_health', 'schema_readiness',
        'publishing_health', 'content_quality',
    ];
    const severity = validSeverities.includes(query.severity) ? query.severity : undefined;
    const category = validCategories.includes(query.category) ? query.category : undefined;
    const entity_type = typeof query.entity_type === 'string' ? query.entity_type.slice(0, 50) : undefined;
    const search = typeof query.search === 'string' ? query.search.slice(0, 100) : undefined;
    return { page, limit, severity, category, entity_type, search };
}
class ContentHealthController {
    static getSummary = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const summary = await content_health_service_1.ContentHealthService.getSummary();
        return response_util_1.ResponseUtil.success(res, summary, 'Content health summary retrieved');
    });
    static getIssues = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const params = parseQueryParams(req.query);
        const result = await content_health_service_1.ContentHealthService.getIssues(params);
        return response_util_1.ResponseUtil.paginated(res, result.issues, result.pagination, 'Content health issues retrieved');
    });
    static getIssuesByCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const validCategories = [
            'seo_health', 'variant_health', 'image_health', 'url_health',
            'import_health', 'taxonomy_health', 'schema_readiness',
            'publishing_health', 'content_quality',
        ];
        const category = req.params.category;
        if (!validCategories.includes(category)) {
            return response_util_1.ResponseUtil.badRequest(res, `Invalid category: ${category}`);
        }
        const params = parseQueryParams(req.query);
        const result = await content_health_service_1.ContentHealthService.getIssuesByCategory(category, params);
        return response_util_1.ResponseUtil.paginated(res, result.issues, result.pagination, `Issues for category "${category}" retrieved`);
    });
    static getEntityIssues = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const validEntityTypes = ['car', 'variant', 'redirect', 'import', 'body_type', 'fuel_type', 'car_image'];
        const entityType = req.params.type;
        const entityId = req.params.id;
        if (!validEntityTypes.includes(entityType)) {
            return response_util_1.ResponseUtil.badRequest(res, `Invalid entity type: ${entityType}`);
        }
        if (!entityId || entityId.length > 100) {
            return response_util_1.ResponseUtil.badRequest(res, 'Invalid entity ID');
        }
        const result = await content_health_service_1.ContentHealthService.getEntityIssues(entityType, entityId);
        return response_util_1.ResponseUtil.success(res, result, `Issues for ${entityType}/${entityId} retrieved`);
    });
}
exports.ContentHealthController = ContentHealthController;
//# sourceMappingURL=content-health.controller.js.map