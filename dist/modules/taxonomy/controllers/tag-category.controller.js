"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagCategoryController = void 0;
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const tag_category_service_1 = require("../services/tag-category.service");
const validation_1 = require("../../../shared/validation");
class TagCategoryController {
    static getAllPublic = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const filterDto = { ...req.query, is_published: true };
        const result = await tag_category_service_1.TagCategoryService.getAll(filterDto, false);
        return response_util_1.ResponseUtil.paginated(res, result.categories, result.pagination, 'Tag categories retrieved successfully');
    });
    static getPublicBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const category = await tag_category_service_1.TagCategoryService.getBySlug(req.params.slug);
        if (!category) {
            throw new app_error_util_1.AppError(`Tag category not found for slug: ${req.params.slug}`, 404);
        }
        return response_util_1.ResponseUtil.success(res, category, 'Tag category retrieved successfully');
    });
    static getAllAdmin = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const includeDeleted = req.query.include_deleted === 'true';
        const result = await tag_category_service_1.TagCategoryService.getAll(req.query, includeDeleted);
        return response_util_1.ResponseUtil.paginated(res, result.categories, result.pagination, 'Tag categories retrieved successfully');
    });
    static getAdminById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const category = await tag_category_service_1.TagCategoryService.getById(req.params.id);
        if (!category) {
            throw new app_error_util_1.AppError(`Tag category not found: ${req.params.id}`, 404);
        }
        return response_util_1.ResponseUtil.success(res, category, 'Tag category retrieved successfully');
    });
    static create = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const dto = {
            name: req.body.name,
            type: req.body.type ?? 'intent',
            description: req.body.description,
            is_published: req.body.is_published,
            sort_order: req.body.sort_order,
        };
        const validation = validation_1.CreateTagCategoryDto.validate(dto);
        if (!validation.success) {
            throw new app_error_util_1.AppError(validation.error.issues.map((e) => e.message).join(', '), 400);
        }
        const created = await tag_category_service_1.TagCategoryService.create(dto);
        return response_util_1.ResponseUtil.created(res, created, 'Tag category created successfully');
    });
    static update = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const dto = {
            name: req.body.name,
            type: req.body.type,
            description: req.body.description,
            is_published: req.body.is_published,
            sort_order: req.body.sort_order,
        };
        const validation = validation_1.UpdateTagCategoryDto.validate(dto);
        if (!validation.success) {
            throw new app_error_util_1.AppError(validation.error.issues.map((e) => e.message).join(', '), 400);
        }
        const updated = await tag_category_service_1.TagCategoryService.update(req.params.id, dto);
        return response_util_1.ResponseUtil.success(res, updated, 'Tag category updated successfully');
    });
    static remove = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const removed = await tag_category_service_1.TagCategoryService.softDelete(req.params.id);
        return response_util_1.ResponseUtil.success(res, removed, 'Tag category deleted successfully');
    });
    static restore = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const restored = await tag_category_service_1.TagCategoryService.restore(req.params.id);
        return response_util_1.ResponseUtil.success(res, restored, 'Tag category restored successfully');
    });
}
exports.TagCategoryController = TagCategoryController;
