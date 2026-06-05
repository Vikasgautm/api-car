"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CityController = void 0;
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const create_city_dto_1 = require("../dto/create-city.dto");
const update_city_dto_1 = require("../dto/update-city.dto");
const city_service_1 = require("../services/city.service");
class CityController {
    // Public routes
    static getAllPublicCities = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await city_service_1.CityService.getAllCities(req.query);
        return response_util_1.ResponseUtil.paginated(res, result.cities, result.pagination, 'Cities retrieved successfully');
    });
    static getPublicCityBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const city = await city_service_1.CityService.getCityBySlug(req.params.slug);
        if (!city) {
            throw new app_error_util_1.AppError("City not found", 404);
        }
        return response_util_1.ResponseUtil.success(res, city, "City retrieved successfully");
    });
    // Admin routes
    static getAllAdminCities = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const includeDeleted = req.query.include_deleted === 'true';
        const result = await city_service_1.CityService.getAllCities(req.query, includeDeleted);
        return response_util_1.ResponseUtil.paginated(res, result.cities, result.pagination, 'Cities retrieved successfully');
    });
    static getAdminCityById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const city = await city_service_1.CityService.getCityById(req.params.id);
        if (!city) {
            throw new app_error_util_1.AppError("City not found", 404);
        }
        return response_util_1.ResponseUtil.success(res, city, "City retrieved successfully");
    });
    static createCity = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const createDto = {
            name: req.body.name,
            state: req.body.state,
            pincode: req.body.pincode,
            longitude: req.body.longitude,
            latitude: req.body.latitude,
        };
        const validation = create_city_dto_1.CreateCityDto.validate(createDto);
        if (!validation.valid) {
            throw new app_error_util_1.AppError(validation.errors.join(', '), 400);
        }
        const city = await city_service_1.CityService.createCity(createDto);
        return response_util_1.ResponseUtil.created(res, city, "City created successfully");
    });
    static updateCity = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const updateDto = {
            name: req.body.name,
            slug: req.body.slug,
            state: req.body.state,
            pincode: req.body.pincode,
            longitude: req.body.longitude,
            latitude: req.body.latitude,
        };
        const validation = update_city_dto_1.UpdateCityDto.validate(updateDto);
        if (!validation.valid) {
            throw new app_error_util_1.AppError(validation.errors.join(', '), 400);
        }
        const city = await city_service_1.CityService.updateCity(req.params.id, updateDto);
        return response_util_1.ResponseUtil.success(res, city, "City updated successfully");
    });
    static deleteCity = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const city = await city_service_1.CityService.deleteCity(req.params.id);
        return response_util_1.ResponseUtil.success(res, city, "City deleted successfully");
    });
    static restoreCity = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const city = await city_service_1.CityService.restoreCity(req.params.id);
        return response_util_1.ResponseUtil.success(res, city, "City restored successfully");
    });
    static bulkSeedCities = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const result = await city_service_1.CityService.bulkSeedCities();
        return response_util_1.ResponseUtil.success(res, result, `Seeded ${result.inserted} cities (${result.skipped} already existed)`);
    });
}
exports.CityController = CityController;
//# sourceMappingURL=city.controller.js.map