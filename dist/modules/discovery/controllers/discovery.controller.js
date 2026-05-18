"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscoveryController = void 0;
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const discovery_service_1 = require("../services/discovery.service");
const seo_filter_generator_service_1 = require("../services/seo-filter-generator.service");
class DiscoveryController {
    static discover = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await discovery_service_1.DiscoveryService.discover(req.query);
        return response_util_1.ResponseUtil.paginated(res, result.cars, result.pagination, 'Discovery results retrieved');
    });
    /**
     * Same shape as `discover` but also surfaces the facets payload — useful for
     * the discovery sidebar. Kept separate so the public list endpoint can avoid
     * paying the facet cost if it doesn't need it.
     */
    static discoverWithFacets = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await discovery_service_1.DiscoveryService.discover(req.query);
        return response_util_1.ResponseUtil.success(res, {
            data: result.cars,
            pagination: result.pagination,
            facets: result.facets,
            applied: result.applied,
        }, 'Discovery results with facets');
    });
    /** Pure count, used by SEO preset preview. */
    static count = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const count = await discovery_service_1.DiscoveryService.count(req.query);
        return response_util_1.ResponseUtil.success(res, { count }, 'Match count retrieved');
    });
    /** Get all available SEO filters based on variant feature availability. */
    static seoFilters = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const filters = await seo_filter_generator_service_1.SeoFilterGeneratorService.getAllFeatures();
        return response_util_1.ResponseUtil.success(res, filters, 'SEO filters retrieved');
    });
    /** Auto-generate SEO presets for features with min variant count. Admin only. */
    static autoGeneratePresetsFromFilters = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const minCount = req.body.min_variant_count || 5;
        const result = await seo_filter_generator_service_1.SeoFilterGeneratorService.autoGeneratePresets(minCount);
        return response_util_1.ResponseUtil.success(res, result, `${result.presets_created} SEO presets auto-generated`);
    });
    /** Get available filters grouped by dimension. */
    static getAvailableFilters = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const filters = await discovery_service_1.DiscoveryService.getAvailableFilters();
        return response_util_1.ResponseUtil.success(res, filters, 'Available filters retrieved');
    });
    /** Get all facet groups. */
    static getFacetGroups = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const facetGroups = await discovery_service_1.DiscoveryService.getFacetGroups();
        return response_util_1.ResponseUtil.success(res, facetGroups, 'Facet groups retrieved');
    });
    /** Get filter options for a specific dimension. */
    static getFilterOptions = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const dimension = req.params.dimension;
        const options = await discovery_service_1.DiscoveryService.getFilterOptions(dimension);
        return response_util_1.ResponseUtil.success(res, options, 'Filter options retrieved');
    });
    /** Preview filter page with given filter combination. */
    static previewFilterPage = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const filters = req.body;
        const result = await discovery_service_1.DiscoveryService.discover(filters);
        return response_util_1.ResponseUtil.success(res, {
            count: result.cars.length,
            cars: result.cars,
            filters: filters,
        }, 'Filter preview generated');
    });
}
exports.DiscoveryController = DiscoveryController;
//# sourceMappingURL=discovery.controller.js.map