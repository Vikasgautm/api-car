"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopularCollectionsController = void 0;
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const popular_collection_service_1 = require("../services/popular-collection.service");
const collection_renderer_service_1 = require("../services/collection-renderer.service");
const collection_status_service_1 = require("../services/collection-status.service");
const qs = (val) => (Array.isArray(val) ? String(val[0]) : String(val ?? ''));
const qn = (val) => {
    const s = Array.isArray(val) ? String(val[0]) : String(val ?? '');
    const n = Number(s);
    return s && !Number.isNaN(n) ? n : undefined;
};
class PopularCollectionsController {
    // ── PUBLIC: HUB + COLLECTION RENDERING ───────────────────────────────────
    static getHub = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const hub = await collection_renderer_service_1.CollectionRendererService.renderHubPreview();
        return response_util_1.ResponseUtil.success(res, hub, 'Popular hub');
    });
    static renderCollection = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const slug = qs(req.params.slug);
        const page = parseInt(qs(req.query.page) || '1', 10);
        const limit = parseInt(qs(req.query.limit) || '24', 10);
        const sort = qs(req.query.sort);
        const filterOverrides = {};
        if (req.query.brand_slugs)
            filterOverrides.brand_slugs = qs(req.query.brand_slugs);
        if (req.query.body_type_slugs)
            filterOverrides.body_type_slugs = qs(req.query.body_type_slugs);
        if (req.query.fuel_type_slugs)
            filterOverrides.fuel_type_slugs = qs(req.query.fuel_type_slugs);
        if (req.query.min_price)
            filterOverrides.min_price = qn(req.query.min_price);
        if (req.query.max_price)
            filterOverrides.max_price = qn(req.query.max_price);
        if (req.query.transmission)
            filterOverrides.transmission = qs(req.query.transmission);
        const result = await collection_renderer_service_1.CollectionRendererService.renderCollection(slug, {
            page,
            limit,
            sort: sort || undefined,
            filter_overrides: Object.keys(filterOverrides).length ? filterOverrides : undefined,
        });
        return response_util_1.ResponseUtil.success(res, result, 'Collection rendered');
    });
    // ── ADMIN: COLLECTION CRUD ────────────────────────────────────────────────
    static list = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const status = req.query.status ? qs(req.query.status) : undefined;
        const collections = await popular_collection_service_1.PopularCollectionService.list(status);
        return response_util_1.ResponseUtil.success(res, collections, 'Collections');
    });
    static getById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const id = qs(req.params.id);
        const coll = await popular_collection_service_1.PopularCollectionService.getById(id);
        return response_util_1.ResponseUtil.success(res, coll, 'Collection');
    });
    static create = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user?.user_id;
        const coll = await popular_collection_service_1.PopularCollectionService.create(req.body, userId);
        return response_util_1.ResponseUtil.success(res, coll, 'Collection created', 201);
    });
    static update = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const id = qs(req.params.id);
        const userId = req.user?.user_id;
        const coll = await popular_collection_service_1.PopularCollectionService.update(id, req.body, userId);
        return response_util_1.ResponseUtil.success(res, coll, 'Collection updated');
    });
    static remove = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const id = qs(req.params.id);
        await popular_collection_service_1.PopularCollectionService.remove(id);
        return response_util_1.ResponseUtil.success(res, null, 'Collection deleted');
    });
    // ── ADMIN: EDITORIAL ORDERING ─────────────────────────────────────────────
    static updateOrdering = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const id = qs(req.params.id);
        const userId = req.user?.user_id;
        const coll = await popular_collection_service_1.PopularCollectionService.updateCarOrdering(id, req.body, userId);
        return response_util_1.ResponseUtil.success(res, coll, 'Ordering updated');
    });
    static updateRenderingMode = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const id = qs(req.params.id);
        const userId = req.user?.user_id;
        const coll = await popular_collection_service_1.PopularCollectionService.updateRenderingMode(id, req.body, userId);
        return response_util_1.ResponseUtil.success(res, coll, 'Rendering mode updated');
    });
    static publish = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const id = qs(req.params.id);
        const userId = req.user?.user_id;
        const coll = await popular_collection_service_1.PopularCollectionService.publish(id, userId);
        return response_util_1.ResponseUtil.success(res, coll, 'Collection published');
    });
    static archive = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const id = qs(req.params.id);
        const userId = req.user?.user_id;
        const coll = await popular_collection_service_1.PopularCollectionService.archive(id, userId);
        return response_util_1.ResponseUtil.success(res, coll, 'Collection archived');
    });
    static reorderHub = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { ordered_ids } = req.body;
        const userId = req.user?.user_id;
        if (!Array.isArray(ordered_ids)) {
            return response_util_1.ResponseUtil.error(res, 'ordered_ids array required', 400);
        }
        await popular_collection_service_1.PopularCollectionService.reorderHubSections(ordered_ids, userId);
        return response_util_1.ResponseUtil.success(res, null, 'Hub order updated');
    });
    // ── ADMIN: RECOMMENDATIONS + STATUS ──────────────────────────────────────
    static getSystemStatus = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const status = await collection_status_service_1.CollectionStatusService.getSystemStatus();
        return response_util_1.ResponseUtil.success(res, status, 'System status');
    });
    static getCollectionStatus = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const id = qs(req.params.id);
        const status = await collection_status_service_1.CollectionStatusService.getCollectionStatus(id);
        if (!status)
            return response_util_1.ResponseUtil.error(res, 'Collection not found', 404);
        return response_util_1.ResponseUtil.success(res, status, 'Collection status');
    });
    static getRecommendations = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const systemStatus = await collection_status_service_1.CollectionStatusService.getSystemStatus();
        const recommendations = systemStatus.collection_statuses.map((s) => ({
            collection_id: s.collection_id,
            slug: s.slug,
            title: s.title,
            current_mode: s.rendering_mode,
            recommendation: s.recommendation,
            detail: s.recommendation_detail,
            behavioral_confidence: s.behavioral_confidence,
            is_ready: s.is_behavioral_ready,
        }));
        return response_util_1.ResponseUtil.success(res, { recommendations, engine_status: systemStatus.engine_status }, 'Recommendations');
    });
    // ── ADMIN: PREVIEW QUERY ──────────────────────────────────────────────────
    static previewQuery = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { discovery_filters } = req.body;
        const resolved = collection_renderer_service_1.CollectionRendererService.buildDiscoveryFilters(discovery_filters ?? {});
        return response_util_1.ResponseUtil.success(res, { resolved_filters: resolved }, 'Preview filters');
    });
}
exports.PopularCollectionsController = PopularCollectionsController;
//# sourceMappingURL=popular-collections.controller.js.map