"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarVariantController = void 0;
const car_variant_service_1 = require("../services/car-variant.service");
const catchAsync_1 = require("../../../utils/catchAsync");
const error_middleware_1 = require("../../../middlewares/error.middleware");
class CarVariantController {
    static getAllVariants = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const isAdmin = req.user && ["admin", "superadmin"].includes(req.user.role);
        const fetchAsAdmin = isAdmin || req.query.admin === "true";
        const result = await car_variant_service_1.CarVariantService.getAllVariants(req.query, fetchAsAdmin);
        res.status(200).json({
            status: 'success',
            data: result,
        });
    });
    static getVariantBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant = await car_variant_service_1.CarVariantService.getVariantBySlug(req.params.slug);
        if (!variant) {
            throw new error_middleware_1.AppError('Variant not found', 404);
        }
        res.status(200).json({
            status: 'success',
            data: { variant },
        });
    });
    static createVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant = await car_variant_service_1.CarVariantService.createVariant(req.body);
        res.status(201).json({
            status: 'success',
            data: { variant },
        });
    });
    static updateVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant = await car_variant_service_1.CarVariantService.updateVariant(req.params.id, req.body);
        if (!variant)
            throw new error_middleware_1.AppError('Variant not found', 404);
        res.status(200).json({
            status: 'success',
            data: { variant },
        });
    });
    static deleteVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant = await car_variant_service_1.CarVariantService.deleteVariant(req.params.id);
        if (!variant)
            throw new error_middleware_1.AppError('Variant not found', 404);
        res.status(200).json({
            status: 'success',
            message: 'Variant soft deleted successfully',
        });
    });
    static restoreVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant = await car_variant_service_1.CarVariantService.restoreVariant(req.params.id);
        if (!variant)
            throw new error_middleware_1.AppError('Variant not found', 404);
        res.status(200).json({
            status: 'success',
            message: 'Variant restored successfully',
            data: { variant },
        });
    });
}
exports.CarVariantController = CarVariantController;
//# sourceMappingURL=car-variant.controller.js.map