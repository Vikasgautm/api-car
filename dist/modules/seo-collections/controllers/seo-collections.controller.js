"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoCollectionsController = void 0;
const catchAsync_1 = require("../../../utils/catchAsync");
const response_util_1 = require("../../../shared/utils/response.util");
const seo_collection_service_1 = require("../services/seo-collection.service");
class SeoCollectionsController {
    static list = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await seo_collection_service_1.SeoCollectionService.list(req.query);
        return response_util_1.ResponseUtil.paginated(res, result.collections, result.pagination, 'SEO collections retrieved');
    });
    static getById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const collection = await seo_collection_service_1.SeoCollectionService.getById(req.params.id);
        return response_util_1.ResponseUtil.success(res, collection);
    });
    static getPublicBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const page = req.query.page ? Number(req.query.page) : undefined;
        const result = await seo_collection_service_1.SeoCollectionService.hydrate(req.params.slug, page);
        return response_util_1.ResponseUtil.success(res, result);
    });
    static create = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user?.user_id;
        const collection = await seo_collection_service_1.SeoCollectionService.create(req.body, userId);
        return response_util_1.ResponseUtil.created(res, collection, 'SEO collection created');
    });
    static update = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user?.user_id;
        const collection = await seo_collection_service_1.SeoCollectionService.update(req.params.id, req.body, userId);
        return response_util_1.ResponseUtil.success(res, collection, 'SEO collection updated');
    });
    static remove = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const collection = await seo_collection_service_1.SeoCollectionService.softDelete(req.params.id);
        return response_util_1.ResponseUtil.success(res, collection, 'SEO collection deleted');
    });
    static refresh = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const collection = await seo_collection_service_1.SeoCollectionService.refresh(req.params.id);
        return response_util_1.ResponseUtil.success(res, collection, 'SEO collection refreshed');
    });
    static generateContent = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const collection = await seo_collection_service_1.SeoCollectionService.generateContent(req.params.id);
        return response_util_1.ResponseUtil.success(res, collection, 'Content generated');
    });
    static previewQuery = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await seo_collection_service_1.SeoCollectionService.previewQuery(req.body);
        return response_util_1.ResponseUtil.success(res, result, 'Preview results');
    });
    static health = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await seo_collection_service_1.SeoCollectionService.getHealth(req.query);
        return response_util_1.ResponseUtil.paginated(res, result.collections, result.pagination, 'Health report');
    });
    static healthSummary = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const summary = await seo_collection_service_1.SeoCollectionService.getHealthSummary();
        return response_util_1.ResponseUtil.success(res, summary, 'Health summary');
    });
}
exports.SeoCollectionsController = SeoCollectionsController;
