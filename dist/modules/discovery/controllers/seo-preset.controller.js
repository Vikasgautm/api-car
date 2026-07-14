"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoPresetController = void 0;
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const seo_preset_service_1 = require("../services/seo-preset.service");
const seo_preset_dto_1 = require("../dto/seo-preset.dto");
class SeoPresetController {
    // ---- Public ----
    static getPublicBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await seo_preset_service_1.SeoPresetService.hydrate(req.params.slug, req.query.page);
        return response_util_1.ResponseUtil.success(res, result, 'SEO landing page resolved');
    });
    // ---- Admin ----
    static list = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await seo_preset_service_1.SeoPresetService.list({
            page: req.query.page ? Number(req.query.page) : undefined,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
            q: req.query.q ? String(req.query.q) : undefined,
            is_published: req.query.is_published === 'true' ? true : req.query.is_published === 'false' ? false : undefined,
            include_deleted: req.query.include_deleted === 'true',
        });
        return response_util_1.ResponseUtil.paginated(res, result.presets, result.pagination, 'SEO presets retrieved');
    });
    static getById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const idParam = req.params.id;
        const preset = await seo_preset_service_1.SeoPresetService.getById(idParam);
        if (!preset)
            throw app_error_util_1.AppError.notFound('SEO preset', 'preset_id', idParam);
        return response_util_1.ResponseUtil.success(res, preset, 'SEO preset retrieved');
    });
    static create = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const dto = {
            slug: req.body.slug,
            title: req.body.title,
            h1: req.body.h1,
            meta_description: req.body.meta_description,
            meta_keywords: req.body.meta_keywords,
            hero_intro: req.body.hero_intro,
            query_params: req.body.query_params,
            is_published: req.body.is_published,
            sort_order: req.body.sort_order,
        };
        const validation = seo_preset_dto_1.CreateSeoPresetDto.validate(dto);
        if (!validation.success)
            throw new app_error_util_1.AppError(validation.error.errors.map((e) => e.message).join(', '), 400);
        const created = await seo_preset_service_1.SeoPresetService.create(dto);
        return response_util_1.ResponseUtil.created(res, created, 'SEO preset created');
    });
    static update = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const dto = {
            slug: req.body.slug,
            title: req.body.title,
            h1: req.body.h1,
            meta_description: req.body.meta_description,
            meta_keywords: req.body.meta_keywords,
            hero_intro: req.body.hero_intro,
            query_params: req.body.query_params,
            is_published: req.body.is_published,
            sort_order: req.body.sort_order,
        };
        const validation = seo_preset_dto_1.UpdateSeoPresetDto.validate(dto);
        if (!validation.success)
            throw new app_error_util_1.AppError(validation.error.errors.map((e) => e.message).join(', '), 400);
        const updated = await seo_preset_service_1.SeoPresetService.update(req.params.id, dto);
        return response_util_1.ResponseUtil.success(res, updated, 'SEO preset updated');
    });
    static remove = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const removed = await seo_preset_service_1.SeoPresetService.softDelete(req.params.id);
        return response_util_1.ResponseUtil.success(res, removed, 'SEO preset deleted');
    });
}
exports.SeoPresetController = SeoPresetController;
