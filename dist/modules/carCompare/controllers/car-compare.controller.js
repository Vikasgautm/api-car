"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarCompareController = void 0;
const car_compare_service_1 = require("../services/car-compare.service");
const catchAsync_1 = require("../../../utils/catchAsync");
class CarCompareController {
    static getAllComparisons = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await car_compare_service_1.CarCompareService.getAllComparisons(req.query);
        res.status(200).json({
            status: 'success',
            data: result,
        });
    });
    static getComparisonByRoute = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const comparison = await car_compare_service_1.CarCompareService.getComparisonByRoute(req.params.route);
        if (!comparison) {
            return res.status(404).json({ status: 'fail', message: 'Comparison not found' });
        }
        res.status(200).json({
            status: 'success',
            data: { comparison },
        });
    });
    static createComparison = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const comparison = await car_compare_service_1.CarCompareService.createComparison(req.body);
        res.status(201).json({
            status: 'success',
            data: { comparison },
        });
    });
}
exports.CarCompareController = CarCompareController;
//# sourceMappingURL=car-compare.controller.js.map