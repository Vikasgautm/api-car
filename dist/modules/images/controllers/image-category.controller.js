"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageCategoryController = void 0;
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const image_category_service_1 = require("../services/image-category.service");
class ImageCategoryController {
    static getAllImageCategories = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await image_category_service_1.ImageCategoryService.getAllImageCategories(req.query);
        return response_util_1.ResponseUtil.paginated(res, result.categories, result.pagination, 'Image categories retrieved successfully');
    });
    static getImageCategoryById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const category = await image_category_service_1.ImageCategoryService.getImageCategoryById(req.params.id);
        if (!category) {
            throw new app_error_util_1.AppError('Image category not found', 404);
        }
        return response_util_1.ResponseUtil.success(res, category, 'Image category retrieved successfully');
    });
    static getImageCategoryBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const category = await image_category_service_1.ImageCategoryService.getImageCategoryBySlug(req.params.slug);
        if (!category) {
            throw new app_error_util_1.AppError('Image category not found', 404);
        }
        return response_util_1.ResponseUtil.success(res, category, 'Image category retrieved successfully');
    });
    static createImageCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const category = await image_category_service_1.ImageCategoryService.createImageCategory(req.body);
        return response_util_1.ResponseUtil.created(res, category, 'Image category created successfully');
    });
    static updateImageCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const category = await image_category_service_1.ImageCategoryService.updateImageCategory(req.params.id, req.body);
        return response_util_1.ResponseUtil.success(res, category, 'Image category updated successfully');
    });
    static deleteImageCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
        await image_category_service_1.ImageCategoryService.deleteImageCategory(req.params.id);
        return response_util_1.ResponseUtil.success(res, null, 'Image category deleted successfully');
    });
    static restoreImageCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const category = await image_category_service_1.ImageCategoryService.restoreImageCategory(req.params.id);
        return response_util_1.ResponseUtil.success(res, category, 'Image category restored successfully');
    });
    static toggleImageCategoryActive = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { is_active } = req.body;
        const category = await image_category_service_1.ImageCategoryService.toggleImageCategoryActive(req.params.id, is_active);
        return response_util_1.ResponseUtil.success(res, category, 'Image category status updated successfully');
    });
    static reorderImageCategories = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { orders } = req.body;
        await image_category_service_1.ImageCategoryService.reorderImageCategories(orders);
        return response_util_1.ResponseUtil.success(res, null, 'Image categories reordered successfully');
    });
}
exports.ImageCategoryController = ImageCategoryController;
//# sourceMappingURL=image-category.controller.js.map