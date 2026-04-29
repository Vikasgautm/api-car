"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarVariantController = void 0;
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const create_variant_dto_1 = require("../dto/create-variant.dto");
const update_variant_dto_1 = require("../dto/update-variant.dto");
const car_variant_service_1 = require("../services/car-variant.service");
class CarVariantController {
    // Public routes
    static getAllPublicVariants = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const filterDto = {
            ...req.query,
            is_published: true,
        };
        const result = await car_variant_service_1.CarVariantService.getAllVariants(filterDto, false);
        const filteredVariants = result.variants.map((variant) => ({
            ...variant,
            specs_normalized: car_variant_service_1.CarVariantService.removeHiddenSpecKeys(variant.specs_normalized, variant.hidden_spec_keys),
        }));
        return response_util_1.ResponseUtil.paginated(res, filteredVariants, result.pagination, 'Variants retrieved successfully');
    });
    static getPublicVariantBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant = await car_variant_service_1.CarVariantService.getVariantBySlug(req.params.slug);
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        const filteredVariant = {
            ...variant,
            specs_normalized: car_variant_service_1.CarVariantService.removeHiddenSpecKeys(variant.specs_normalized, variant.hidden_spec_keys),
        };
        return response_util_1.ResponseUtil.success(res, filteredVariant, 'Variant retrieved successfully');
    });
    // Admin routes
    static getAllAdminVariants = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await car_variant_service_1.CarVariantService.getAllVariants(req.query, true);
        return response_util_1.ResponseUtil.paginated(res, result.variants, result.pagination, 'Variants retrieved successfully');
    });
    static getAdminVariantById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant = await car_variant_service_1.CarVariantService.getVariantById(req.params.id);
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        return response_util_1.ResponseUtil.success(res, variant, 'Variant retrieved successfully');
    });
    static createVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const createDto = {
            car_id: req.body.car_id,
            variant_name: req.body.variant_name,
            model_year: req.body.model_year,
            fuel_type_id: req.body.fuel_type_id,
            transmission_type: req.body.transmission_type,
            drivetrain: req.body.drivetrain,
            seating_capacity: req.body.seating_capacity,
            ex_showroom_price: req.body.ex_showroom_price,
            expected_price: req.body.expected_price,
            expected_launch_date: req.body.expected_launch_date,
            specs_normalized: req.body.specs_normalized,
            hidden_spec_keys: req.body.hidden_spec_keys,
            is_published: req.body.is_published,
        };
        const validation = create_variant_dto_1.CreateVariantDto.validate(createDto);
        if (!validation.valid) {
            throw new app_error_util_1.AppError(validation.errors.join(', '), 400);
        }
        const variant = await car_variant_service_1.CarVariantService.createVariant(createDto);
        return response_util_1.ResponseUtil.created(res, variant, 'Variant created successfully');
    });
    static updateVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const updateDto = {
            car_id: req.body.car_id,
            variant_name: req.body.variant_name,
            model_year: req.body.model_year,
            fuel_type_id: req.body.fuel_type_id,
            transmission_type: req.body.transmission_type,
            drivetrain: req.body.drivetrain,
            seating_capacity: req.body.seating_capacity,
            ex_showroom_price: req.body.ex_showroom_price,
            expected_price: req.body.expected_price,
            expected_launch_date: req.body.expected_launch_date,
            specs_normalized: req.body.specs_normalized,
            hidden_spec_keys: req.body.hidden_spec_keys,
            is_published: req.body.is_published !== undefined ? req.body.is_published === 'true' || req.body.is_published === true : undefined,
        };
        const validation = update_variant_dto_1.UpdateVariantDto.validate(updateDto);
        if (!validation.valid) {
            throw new app_error_util_1.AppError(validation.errors.join(', '), 400);
        }
        const variant = await car_variant_service_1.CarVariantService.updateVariant(req.params.id, updateDto);
        return response_util_1.ResponseUtil.success(res, variant, 'Variant updated successfully');
    });
    static deleteVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        await car_variant_service_1.CarVariantService.deleteVariant(req.params.id);
        return response_util_1.ResponseUtil.success(res, null, 'Variant deleted successfully');
    });
    static restoreVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant = await car_variant_service_1.CarVariantService.restoreVariant(req.params.id);
        return response_util_1.ResponseUtil.success(res, variant, 'Variant restored successfully');
    });
    static togglePublish = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant = await car_variant_service_1.CarVariantService.togglePublish(req.params.id);
        return response_util_1.ResponseUtil.success(res, variant, 'Variant publish status toggled successfully');
    });
    static publishVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant = await car_variant_service_1.CarVariantService.publishVariant(req.params.id);
        return response_util_1.ResponseUtil.success(res, variant, 'Variant published successfully');
    });
    static unpublishVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant = await car_variant_service_1.CarVariantService.unpublishVariant(req.params.id);
        return response_util_1.ResponseUtil.success(res, variant, 'Variant unpublished successfully');
    });
}
exports.CarVariantController = CarVariantController;
//# sourceMappingURL=car-variant.controller.js.map