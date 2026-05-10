"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarController = void 0;
const errorMessages_1 = require("../../../constants/errorMessages");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const create_car_dto_1 = require("../dto/create-car.dto");
const update_car_dto_1 = require("../dto/update-car.dto");
const car_service_1 = require("../services/car.service");
class CarController {
    // Public routes
    static getAllPublicCars = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const filterDto = {
            ...req.query,
            is_published: true,
        };
        const result = await car_service_1.CarService.getAllCars(filterDto, false);
        return response_util_1.ResponseUtil.paginated(res, result.cars, result.pagination, 'Cars retrieved successfully');
    });
    static getPublicCarBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await car_service_1.CarService.getCarBySlug(req.params.slug);
        if (!result) {
            throw new app_error_util_1.AppError(`Car not found for slug: ${req.params.slug}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.CAR_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.CAR_NOT_FOUND,
                details: {
                    field: 'slug',
                    reason: 'The car does not exist or has been deleted.',
                },
            });
        }
        return response_util_1.ResponseUtil.success(res, result, "Car retrieved successfully");
    });
    // Admin routes
    static getAllAdminCars = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const includeDeleted = req.query.include_deleted === 'true';
        const result = await car_service_1.CarService.getAllCars(req.query, includeDeleted);
        return response_util_1.ResponseUtil.paginated(res, result.cars, result.pagination, 'Cars retrieved successfully');
    });
    static getAdminCarById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const car = await car_service_1.CarService.getCarById(req.params.id);
        if (!car) {
            throw new app_error_util_1.AppError(`Car not found for car_id: ${req.params.id}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.CAR_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.CAR_NOT_FOUND,
                details: {
                    field: 'car_id',
                    reason: 'The car does not exist or has been deleted.',
                },
            });
        }
        return response_util_1.ResponseUtil.success(res, car, "Car retrieved successfully");
    });
    static createCar = (0, catchAsync_1.catchAsync)(async (req, res) => {
        let thumbnailUrl = req.body.thumbnail_url;
        if (req.file) {
            // Handle both local storage (path) and Cloudinary (secure_url)
            const cloudinaryFile = req.file;
            thumbnailUrl = cloudinaryFile.secure_url || req.file.path;
        }
        // Handle gallery images
        let gallery;
        if (req.body.gallery) {
            try {
                gallery = typeof req.body.gallery === 'string'
                    ? JSON.parse(req.body.gallery)
                    : req.body.gallery;
            }
            catch (e) {
                // If parsing fails, use as-is
                gallery = req.body.gallery;
            }
        }
        const createDto = {
            name: req.body.name,
            brand_id: req.body.brand_id,
            body_type_id: req.body.body_type_id,
            fuel_type_id: req.body.fuel_type_id,
            description: req.body.description,
            thumbnail_url: thumbnailUrl,
            thumbnail_alt: req.body.thumbnail_alt,
            gallery: gallery,
            gallery_summary: req.body.gallery_summary,
            status: req.body.status,
            is_upcoming: req.body.is_upcoming,
            is_launched: req.body.is_launched,
            expected_exshowroom_price: req.body.expected_exshowroom_price,
            expected_launch_date: req.body.expected_launch_date,
            exshowroom_price: req.body.exshowroom_price,
            launch_date: req.body.launch_date,
            is_electric: req.body.is_electric,
            is_published: req.body.is_published,
            is_featured: req.body.is_featured,
            is_popular: req.body.is_popular,
            is_recommended: req.body.is_recommended,
            is_latest: req.body.is_latest,
            top_selling: req.body.top_selling,
            meta_title: req.body.meta_title,
            meta_description: req.body.meta_description,
            meta_keywords: req.body.meta_keywords,
            og_image: req.body.og_image,
            canonical_url: req.body.canonical_url,
            noindex: req.body.noindex,
        };
        const validation = create_car_dto_1.CreateCarDto.validate(createDto);
        if (!validation.valid) {
            throw new app_error_util_1.AppError(validation.errors.join(', '), 400);
        }
        const car = await car_service_1.CarService.createCar(createDto);
        return response_util_1.ResponseUtil.created(res, car, "Car created successfully");
    });
    static updateCar = (0, catchAsync_1.catchAsync)(async (req, res) => {
        let thumbnailUrl = req.body.thumbnail_url;
        if (req.file) {
            // Handle both local storage (path) and Cloudinary (secure_url)
            const cloudinaryFile = req.file;
            thumbnailUrl = cloudinaryFile.secure_url || req.file.path;
        }
        // Handle gallery images
        let gallery;
        if (req.body.gallery) {
            try {
                gallery = typeof req.body.gallery === 'string'
                    ? JSON.parse(req.body.gallery)
                    : req.body.gallery;
            }
            catch (e) {
                // If parsing fails, use as-is
                gallery = req.body.gallery;
            }
        }
        const updateDto = {
            name: req.body.name,
            brand_id: req.body.brand_id,
            body_type_id: req.body.body_type_id,
            fuel_type_id: req.body.fuel_type_id,
            short_description: req.body.short_description,
            description: req.body.description,
            thumbnail_url: thumbnailUrl,
            thumbnail_alt: req.body.thumbnail_alt,
            gallery: gallery,
            gallery_summary: req.body.gallery_summary,
            status: req.body.status,
            is_upcoming: req.body.is_upcoming !== undefined ? req.body.is_upcoming === 'true' || req.body.is_upcoming === true : undefined,
            is_launched: req.body.is_launched !== undefined ? req.body.is_launched === 'true' || req.body.is_launched === true : undefined,
            expected_exshowroom_price: req.body.expected_exshowroom_price,
            expected_launch_date: req.body.expected_launch_date,
            exshowroom_price: req.body.exshowroom_price,
            launch_date: req.body.launch_date,
            is_electric: req.body.is_electric !== undefined ? req.body.is_electric === 'true' || req.body.is_electric === true : undefined,
            is_published: req.body.is_published !== undefined ? req.body.is_published === 'true' || req.body.is_published === true : undefined,
            is_featured: req.body.is_featured !== undefined ? req.body.is_featured === 'true' || req.body.is_featured === true : undefined,
            is_popular: req.body.is_popular !== undefined ? req.body.is_popular === 'true' || req.body.is_popular === true : undefined,
            is_recommended: req.body.is_recommended !== undefined ? req.body.is_recommended === 'true' || req.body.is_recommended === true : undefined,
            is_latest: req.body.is_latest !== undefined ? req.body.is_latest === 'true' || req.body.is_latest === true : undefined,
            top_selling: req.body.top_selling !== undefined ? req.body.top_selling === 'true' || req.body.top_selling === true : undefined,
            meta_title: req.body.meta_title,
            meta_description: req.body.meta_description,
            meta_keywords: req.body.meta_keywords,
            og_image: req.body.og_image,
            canonical_url: req.body.canonical_url,
            noindex: req.body.noindex,
        };
        const validation = update_car_dto_1.UpdateCarDto.validate(updateDto);
        if (!validation.valid) {
            throw new app_error_util_1.AppError(validation.errors.join(', '), 400);
        }
        const car = await car_service_1.CarService.updateCar(req.params.id, updateDto);
        return response_util_1.ResponseUtil.success(res, car, "Car updated successfully");
    });
    static deleteCar = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const car = await car_service_1.CarService.deleteCar(req.params.id);
        return response_util_1.ResponseUtil.success(res, car, "Car deleted successfully");
    });
    static restoreCar = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const car = await car_service_1.CarService.restoreCar(req.params.id);
        return response_util_1.ResponseUtil.success(res, car, "Car restored successfully");
    });
    static togglePublish = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const car = await car_service_1.CarService.togglePublish(req.params.id);
        return response_util_1.ResponseUtil.success(res, car, "Car publish status toggled successfully");
    });
    static markLaunched = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const car = await car_service_1.CarService.markLaunched(req.params.id);
        return response_util_1.ResponseUtil.success(res, car, "Car marked as launched successfully");
    });
    static markUpcoming = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { expected_exshowroom_price, expected_launch_date } = req.body;
        const car = await car_service_1.CarService.markUpcoming(req.params.id, {
            expected_exshowroom_price,
            expected_launch_date,
        });
        return response_util_1.ResponseUtil.success(res, car, "Car marked as upcoming successfully");
    });
}
exports.CarController = CarController;
//# sourceMappingURL=car.controller.js.map