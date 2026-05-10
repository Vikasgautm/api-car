"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageSubCategoryController = void 0;
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const image_subcategory_service_1 = require("../services/image-subcategory.service");
class ImageSubCategoryController {
    static getAllImageSubCategories = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await image_subcategory_service_1.ImageSubCategoryService.getAllImageSubCategories(req.query);
        return response_util_1.ResponseUtil.paginated(res, result.subcategories, result.pagination, 'Image subcategories retrieved successfully');
    });
    static getImageSubCategoryById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const subcategory = await image_subcategory_service_1.ImageSubCategoryService.getImageSubCategoryById(req.params.id);
        if (!subcategory) {
            throw new app_error_util_1.AppError('Image subcategory not found', 404);
        }
        return response_util_1.ResponseUtil.success(res, subcategory, 'Image subcategory retrieved successfully');
    });
    static getImageSubCategoryBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const subcategory = await image_subcategory_service_1.ImageSubCategoryService.getImageSubCategoryBySlug(req.params.slug);
        if (!subcategory) {
            throw new app_error_util_1.AppError('Image subcategory not found', 404);
        }
        return response_util_1.ResponseUtil.success(res, subcategory, 'Image subcategory retrieved successfully');
    });
    static createImageSubCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const subcategory = await image_subcategory_service_1.ImageSubCategoryService.createImageSubCategory(req.body);
        return response_util_1.ResponseUtil.created(res, subcategory, 'Image subcategory created successfully');
    });
    static updateImageSubCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const subcategory = await image_subcategory_service_1.ImageSubCategoryService.updateImageSubCategory(req.params.id, req.body);
        return response_util_1.ResponseUtil.success(res, subcategory, 'Image subcategory updated successfully');
    });
    static deleteImageSubCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const subcategory = await image_subcategory_service_1.ImageSubCategoryService.deleteImageSubCategory(req.params.id);
        return response_util_1.ResponseUtil.success(res, subcategory, 'Image subcategory deleted successfully');
    });
    static restoreImageSubCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const subcategory = await image_subcategory_service_1.ImageSubCategoryService.restoreImageSubCategory(req.params.id);
        return response_util_1.ResponseUtil.success(res, subcategory, 'Image subcategory restored successfully');
    });
    static toggleImageSubCategoryActive = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { is_active } = req.body;
        const subcategory = await image_subcategory_service_1.ImageSubCategoryService.toggleImageSubCategoryActive(req.params.id, is_active);
        return response_util_1.ResponseUtil.success(res, subcategory, 'Image subcategory status updated successfully');
    });
    static reorderImageSubCategories = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { orders } = req.body;
        await image_subcategory_service_1.ImageSubCategoryService.reorderImageSubCategories(orders);
        return response_util_1.ResponseUtil.success(res, null, 'Image subcategories reordered successfully');
    });
}
exports.ImageSubCategoryController = ImageSubCategoryController;
//# sourceMappingURL=image-subcategory.controller.js.map