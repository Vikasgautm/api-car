"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagController = void 0;
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const tag_service_1 = require("../services/tag.service");
const validation_1 = require("../../../shared/validation");
class TagController {
    static getAllPublic = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const filterDto = { ...req.query, is_published: true };
        const result = await tag_service_1.TagService.getAll(filterDto, false);
        return response_util_1.ResponseUtil.paginated(res, result.tags, result.pagination, 'Tags retrieved successfully');
    });
    static getPublicBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const tag = await tag_service_1.TagService.getBySlug(req.params.slug);
        if (!tag) {
            throw new app_error_util_1.AppError(`Tag not found for slug: ${req.params.slug}`, 404);
        }
        return response_util_1.ResponseUtil.success(res, tag, 'Tag retrieved successfully');
    });
    static getAllAdmin = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const includeDeleted = req.query.include_deleted === 'true';
        const result = await tag_service_1.TagService.getAll(req.query, includeDeleted);
        return response_util_1.ResponseUtil.paginated(res, result.tags, result.pagination, 'Tags retrieved successfully');
    });
    static getAdminById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const tag = await tag_service_1.TagService.getById(req.params.id);
        if (!tag) {
            throw new app_error_util_1.AppError(`Tag not found: ${req.params.id}`, 404);
        }
        return response_util_1.ResponseUtil.success(res, tag, 'Tag retrieved successfully');
    });
    static create = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const dto = {
            tag_category_id: req.body.tag_category_id,
            name: req.body.name,
            description: req.body.description,
            seo_meta: req.body.seo_meta,
            is_published: req.body.is_published,
            sort_order: req.body.sort_order,
        };
        const validation = validation_1.CreateTagDto.validate(dto);
        if (!validation.success) {
            throw new app_error_util_1.AppError(validation.error.errors.map(e => e.message).join(', '), 400);
        }
        const created = await tag_service_1.TagService.create(dto);
        return response_util_1.ResponseUtil.created(res, created, 'Tag created successfully');
    });
    static update = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const dto = {
            tag_category_id: req.body.tag_category_id,
            name: req.body.name,
            description: req.body.description,
            seo_meta: req.body.seo_meta,
            is_published: req.body.is_published,
            sort_order: req.body.sort_order,
        };
        const validation = validation_1.UpdateTagDto.validate(dto);
        if (!validation.success) {
            throw new app_error_util_1.AppError(validation.error.errors.map(e => e.message).join(', '), 400);
        }
        const updated = await tag_service_1.TagService.update(req.params.id, dto);
        return response_util_1.ResponseUtil.success(res, updated, 'Tag updated successfully');
    });
    static remove = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const removed = await tag_service_1.TagService.softDelete(req.params.id);
        return response_util_1.ResponseUtil.success(res, removed, 'Tag deleted successfully');
    });
    static restore = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const restored = await tag_service_1.TagService.restore(req.params.id);
        return response_util_1.ResponseUtil.success(res, restored, 'Tag restored successfully');
    });
}
exports.TagController = TagController;
