"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarCompareController = void 0;
const car_compare_service_1 = require("../services/car-compare.service");
const catchAsync_1 = require("../../../utils/catchAsync");
const error_middleware_1 = require("../../../middlewares/error.middleware");
class CarCompareController {
    static getAllComparisons = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const isAdmin = req.user && ["admin", "superadmin"].includes(req.user.role);
        const fetchAsAdmin = isAdmin || req.query.admin === "true";
        const result = await car_compare_service_1.CarCompareService.getAllComparisons(req.query, fetchAsAdmin);
        res.status(200).json({
            status: 'success',
            data: result,
        });
    });
    static getComparisonByRoute = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const comparison = await car_compare_service_1.CarCompareService.getComparisonByRoute(req.params.route);
        if (!comparison) {
            throw new error_middleware_1.AppError('Comparison not found', 404);
        }
        res.status(200).json({
            status: 'success',
            data: { comparison },
        });
    });
    static createComparison = (0, catchAsync_1.catchAsync)(async (req, res) => {
        let images = [];
        if (req.files?.["images"]) {
            images = req.files["images"].map((file) => ({
                preview: file.path,
                title: req.body.title || "",
            }));
        }
        const comparison = await car_compare_service_1.CarCompareService.createComparison({ ...req.body, image: images });
        res.status(201).json({
            status: 'success',
            data: { comparison },
        });
    });
    static updateComparison = (0, catchAsync_1.catchAsync)(async (req, res) => {
        let updateData = { ...req.body };
        if (req.files?.["images"]) {
            const newImages = req.files["images"].map((file) => ({
                preview: file.path,
                title: req.body.title || "",
            }));
            updateData.image = newImages;
        }
        const comparison = await car_compare_service_1.CarCompareService.updateComparison(req.params.id, updateData);
        if (!comparison)
            throw new error_middleware_1.AppError('Comparison not found', 404);
        res.status(200).json({
            status: 'success',
            data: { comparison },
        });
    });
    static deleteComparison = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const comparison = await car_compare_service_1.CarCompareService.deleteComparison(req.params.id);
        if (!comparison)
            throw new error_middleware_1.AppError('Comparison not found', 404);
        res.status(200).json({
            status: 'success',
            message: 'Comparison soft deleted successfully',
        });
    });
    static restoreComparison = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const comparison = await car_compare_service_1.CarCompareService.restoreComparison(req.params.id);
        if (!comparison)
            throw new error_middleware_1.AppError('Comparison not found', 404);
        res.status(200).json({
            status: 'success',
            message: 'Comparison restored successfully',
            data: { comparison },
        });
    });
}
exports.CarCompareController = CarCompareController;
//# sourceMappingURL=car-compare.controller.js.map