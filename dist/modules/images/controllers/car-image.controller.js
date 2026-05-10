"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarImageController = void 0;
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const car_image_service_1 = require("../services/car-image.service");
// Helper to safely parse JSON fields from FormData
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
// Helper to parse FormData body with potential JSON strings
const parseFormDataBody = (body) => {
    const parsed = {};
    for (const [key, value] of Object.entries(body)) {
        // Fields that should be parsed as JSON if they are strings
        const jsonFields = ['tags', 'metadata', 'car_id', 'variant_id', 'category_id', 'sub_category_id', 'display_order', 'is_primary', 'is_published'];
        if (jsonFields.includes(key)) {
            parsed[key] = parseJSONField(value);
        }
        else {
            parsed[key] = value;
        }
    }
    return parsed;
};
class CarImageController {
    // Public routes
    static getPublicGallery = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await car_image_service_1.CarImageService.getPublicGallery(req.query);
        return response_util_1.ResponseUtil.paginated(res, result.images, result.pagination, 'Gallery retrieved successfully');
    });
    static getCarGallery = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await car_image_service_1.CarImageService.getCarGallery(req.params.carId);
        return response_util_1.ResponseUtil.success(res, result, 'Car gallery retrieved successfully');
    });
    // Admin routes
    static getAllAdminCarImages = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const includeDeleted = req.query.include_deleted === 'true';
        const result = await car_image_service_1.CarImageService.getAllCarImages(req.query, includeDeleted);
        return response_util_1.ResponseUtil.paginated(res, result.images, result.pagination, 'Car images retrieved successfully');
    });
    static getAdminCarImageById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const image = await car_image_service_1.CarImageService.getCarImageById(req.params.id);
        if (!image) {
            throw new app_error_util_1.AppError('Car image not found', 404);
        }
        return response_util_1.ResponseUtil.success(res, image, 'Car image retrieved successfully');
    });
    static createCarImage = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const uploadedBy = req.user?.user_id || req.user?.id;
        // Parse JSON fields from FormData
        const parsedBody = parseFormDataBody(req.body);
        const imageData = {
            ...parsedBody,
            url: req.file?.secure_url || req.file?.path || parsedBody.url,
            thumbnail_url: parsedBody.thumbnail_url,
        };
        const image = await car_image_service_1.CarImageService.createCarImage(imageData, uploadedBy);
        return response_util_1.ResponseUtil.created(res, image, 'Car image created successfully');
    });
    static updateCarImage = (0, catchAsync_1.catchAsync)(async (req, res) => {
        // Parse JSON fields from FormData
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
    static togglePublish = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const image = await car_image_service_1.CarImageService.togglePublish(req.params.id);
        return response_util_1.ResponseUtil.success(res, image, 'Car image publish status toggled successfully');
    });
    static setPrimaryImage = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const image = await car_image_service_1.CarImageService.setPrimaryImage(req.params.id);
        return response_util_1.ResponseUtil.success(res, image, 'Car image set as primary successfully');
    });
}
exports.CarImageController = CarImageController;
//# sourceMappingURL=car-image.controller.js.map