"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CityController = void 0;
const city_service_1 = require("../services/city.service");
const catchAsync_1 = require("../../../utils/catchAsync");
const error_middleware_1 = require("../../../middlewares/error.middleware");
class CityController {
    static getAllCities = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await city_service_1.CityService.getAllCities(req.query);
        res.status(200).json({
            status: 'success',
            data: result,
        });
    });
    static createCity = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const city = await city_service_1.CityService.createCity(req.body);
        res.status(201).json({
            status: 'success',
            data: { city },
        });
    });
    static updateCity = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const city = await city_service_1.CityService.updateCity(req.params.id, req.body);
        if (!city)
            throw new error_middleware_1.AppError('City not found', 404);
        res.status(200).json({
            status: 'success',
            data: { city },
        });
    });
    static deleteCity = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const city = await city_service_1.CityService.deleteCity(req.params.id);
        if (!city)
            throw new error_middleware_1.AppError('City not found', 404);
        res.status(200).json({
            status: 'success',
            message: 'City soft deleted successfully',
        });
    });
    static restoreCity = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const city = await city_service_1.CityService.restoreCity(req.params.id);
        if (!city)
            throw new error_middleware_1.AppError('City not found', 404);
        res.status(200).json({
            status: 'success',
            message: 'City restored successfully',
            data: { city },
        });
    });
}
exports.CityController = CityController;
//# sourceMappingURL=city.controller.js.map