"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuelTypeController = void 0;
const errorMessages_1 = require("../../../constants/errorMessages");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const create_fuel_type_dto_1 = require("../dto/create-fuel-type.dto");
const update_fuel_type_dto_1 = require("../dto/update-fuel-type.dto");
const fuel_type_service_1 = require("../services/fuel-type.service");
class FuelTypeController {
    // Public routes
    static getAllPublicFuelTypes = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const filterDto = {
            ...req.query,
            is_published: true,
        };
        const result = await fuel_type_service_1.FuelTypeService.getAllFuelTypes(filterDto, false);
        return response_util_1.ResponseUtil.paginated(res, result.fuelTypes, result.pagination, 'Fuel types retrieved successfully');
    });
    static getPublicFuelTypeBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const fuelType = await fuel_type_service_1.FuelTypeService.getFuelTypeBySlug(req.params.slug);
        if (!fuelType) {
            throw new app_error_util_1.AppError(`Fuel type not found for slug: ${req.params.slug}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.FUEL_TYPE_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.FUEL_TYPE_NOT_FOUND,
                details: {
                    field: 'slug',
                    reason: 'The fuel type does not exist or has been deleted.',
                },
            });
        }
        return response_util_1.ResponseUtil.success(res, fuelType, "Fuel type retrieved successfully");
    });
    // Admin routes
    static getAllAdminFuelTypes = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const includeDeleted = req.query.include_deleted === 'true';
        const result = await fuel_type_service_1.FuelTypeService.getAllFuelTypes(req.query, includeDeleted);
        return response_util_1.ResponseUtil.paginated(res, result.fuelTypes, result.pagination, 'Fuel types retrieved successfully');
    });
    static getAdminFuelTypeById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const fuelType = await fuel_type_service_1.FuelTypeService.getFuelTypeById(req.params.id);
        if (!fuelType) {
            throw new app_error_util_1.AppError(`Fuel type not found for fuel_type_id: ${req.params.id}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.FUEL_TYPE_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.FUEL_TYPE_NOT_FOUND,
                details: {
                    field: 'fuel_type_id',
                    reason: 'The fuel type does not exist or has been deleted.',
                },
            });
        }
        return response_util_1.ResponseUtil.success(res, fuelType, "Fuel type retrieved successfully");
    });
    static createFuelType = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const createDto = {
            name: req.body.name,
            description: req.body.description,
            is_published: req.body.is_published,
            is_featured: req.body.is_featured,
        };
        const validation = create_fuel_type_dto_1.CreateFuelTypeDto.validate(createDto);
        if (!validation.valid) {
            throw new app_error_util_1.AppError(validation.errors.join(', '), 400);
        }
        const fuelType = await fuel_type_service_1.FuelTypeService.createFuelType(createDto);
        return response_util_1.ResponseUtil.created(res, fuelType, "Fuel type created successfully");
    });
    static updateFuelType = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const updateDto = {
            name: req.body.name,
            description: req.body.description,
            is_published: req.body.is_published !== undefined ? req.body.is_published === 'true' || req.body.is_published === true : undefined,
            is_featured: req.body.is_featured !== undefined ? req.body.is_featured === 'true' || req.body.is_featured === true : undefined,
        };
        const validation = update_fuel_type_dto_1.UpdateFuelTypeDto.validate(updateDto);
        if (!validation.valid) {
            throw new app_error_util_1.AppError(validation.errors.join(', '), 400);
        }
        const fuelType = await fuel_type_service_1.FuelTypeService.updateFuelType(req.params.id, updateDto);
        return response_util_1.ResponseUtil.success(res, fuelType, "Fuel type updated successfully");
    });
    static deleteFuelType = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const fuelType = await fuel_type_service_1.FuelTypeService.deleteFuelType(req.params.id);
        return response_util_1.ResponseUtil.success(res, fuelType, "Fuel type deleted successfully");
    });
    static restoreFuelType = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const fuelType = await fuel_type_service_1.FuelTypeService.restoreFuelType(req.params.id);
        return response_util_1.ResponseUtil.success(res, fuelType, "Fuel type restored successfully");
    });
    static togglePublish = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const fuelType = await fuel_type_service_1.FuelTypeService.togglePublish(req.params.id);
        return response_util_1.ResponseUtil.success(res, fuelType, "Fuel type publish status updated successfully");
    });
}
exports.FuelTypeController = FuelTypeController;
//# sourceMappingURL=fuel-type.controller.js.map