"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarImageController = void 0;
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const car_image_service_1 = require("../services/car-image.service");
// ─── FormData parsing helpers ────────────────────────────────────────────────
const JSON_FIELDS = [
    'tags', 'metadata', 'car_id', 'variant_id',
    'category_id', 'sub_category_id',
    'display_order', 'sort_order', 'is_primary', 'is_published',
];
const parseJSONField = (value) => {
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    return value;
};
const parseFormDataBody = (body) => {
    const parsed = {};
    for (const [key, value] of Object.entries(body)) {
        parsed[key] = JSON_FIELDS.includes(key) ? parseJSONField(value) : value;
    }
    return parsed;
};
// ─── Controller ──────────────────────────────────────────────────────────────
class CarImageController {
    // ─── Public ────────────────────────────────────────────────────────────────
    static getPublicGallery = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await car_image_service_1.CarImageService.getPublicGallery(req.query);
        return response_util_1.ResponseUtil.paginated(res, result.images, result.pagination, 'Gallery retrieved successfully');
    });
    static getCarGallery = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await car_image_service_1.CarImageService.getCarGallery(req.params.carId);
        return response_util_1.ResponseUtil.success(res, result, 'Car gallery retrieved successfully');
    });
    static getImagesByCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { carId, category } = req.params;
        const { sub_category } = req.query;
        const images = await car_image_service_1.CarImageService.getImagesByCategory(carId, category, sub_category);
        return response_util_1.ResponseUtil.success(res, images, 'Category images retrieved successfully');
    });
    static getPrimaryWithFallback = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await car_image_service_1.CarImageService.getPrimaryWithFallback(req.params.carId);
        return response_util_1.ResponseUtil.success(res, result, 'Primary image resolved');
    });
    // ─── Admin — list / single ─────────────────────────────────────────────────
    static getAllAdminCarImages = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const includeDeleted = req.query.include_deleted === 'true';
        const result = await car_image_service_1.CarImageService.getAllCarImages(req.query, includeDeleted);
        return response_util_1.ResponseUtil.paginated(res, result.images, result.pagination, 'Car images retrieved successfully');
    });
    static getAdminCarImageById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const image = await car_image_service_1.CarImageService.getCarImageById(req.params.id);
        if (!image)
            throw new app_error_util_1.AppError('Car image not found', 404);
        return response_util_1.ResponseUtil.success(res, image, 'Car image retrieved successfully');
    });
    // ─── Admin — create / update / delete ─────────────────────────────────────
    static createCarImage = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const uploadedBy = req.user?.user_id || req.user?.id;
        const parsedBody = parseFormDataBody(req.body);
        const imageData = {
            ...parsedBody,
            url: req.file?.secure_url || req.file?.path || parsedBody.url,
        };
        const image = await car_image_service_1.CarImageService.createCarImage(imageData, uploadedBy);
        return response_util_1.ResponseUtil.created(res, image, 'Car image created successfully');
    });
    static updateCarImage = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const parsedBody = parseFormDataBody(req.body);
        const imageData = {
            ...parsedBody,
            url: req.file?.secure_url || req.file?.path || parsedBody.url,
        };
        const image = await car_image_service_1.CarImageService.updateCarImage(req.params.id, imageData);
        return response_util_1.ResponseUtil.success(res, image, 'Car image updated successfully');
    });
    static deleteCarImage = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const image = await car_image_service_1.CarImageService.deleteCarImage(req.params.id);
        return response_util_1.ResponseUtil.success(res, image, 'Car image deleted successfully');
    });
    static restoreCarImage = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const image = await car_image_service_1.CarImageService.restoreCarImage(req.params.id);
        return response_util_1.ResponseUtil.success(res, image, 'Car image restored successfully');
    });
    // ─── Admin — status / primary toggles ─────────────────────────────────────
    static togglePublish = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const image = await car_image_service_1.CarImageService.togglePublish(req.params.id);
        return response_util_1.ResponseUtil.success(res, image, 'Publish status toggled');
    });
    static setPrimaryImage = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const image = await car_image_service_1.CarImageService.setPrimaryImage(req.params.id);
        return response_util_1.ResponseUtil.success(res, image, 'Primary image set successfully');
    });
    // ─── Admin — bulk operations ───────────────────────────────────────────────
    static bulkUpdateStatus = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { image_ids, status } = req.body;
        if (!Array.isArray(image_ids) || !image_ids.length) {
            throw new app_error_util_1.AppError('image_ids array is required', 400);
        }
        if (!status)
            throw new app_error_util_1.AppError('status is required', 400);
        const result = await car_image_service_1.CarImageService.bulkUpdateStatus(image_ids, status);
        return response_util_1.ResponseUtil.success(res, result, `Status updated to "${status}" for ${result.modifiedCount} images`);
    });
    static bulkAssignCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { image_ids, main_category, sub_category } = req.body;
        if (!Array.isArray(image_ids) || !image_ids.length) {
            throw new app_error_util_1.AppError('image_ids array is required', 400);
        }
        if (!main_category)
            throw new app_error_util_1.AppError('main_category is required', 400);
        const result = await car_image_service_1.CarImageService.bulkAssignCategory(image_ids, main_category, sub_category);
        return response_util_1.ResponseUtil.success(res, result, `Category assigned to ${result.modifiedCount} images`);
    });
    static bulkDelete = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { image_ids } = req.body;
        if (!Array.isArray(image_ids) || !image_ids.length) {
            throw new app_error_util_1.AppError('image_ids array is required', 400);
        }
        const result = await car_image_service_1.CarImageService.bulkDelete(image_ids);
        return response_util_1.ResponseUtil.success(res, result, `${result.modifiedCount} images deleted`);
    });
}
exports.CarImageController = CarImageController;
//# sourceMappingURL=car-image.controller.js.map