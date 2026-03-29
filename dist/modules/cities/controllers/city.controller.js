"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CityController = void 0;
const city_service_1 = require("../services/city.service");
const catchAsync_1 = require("../../../utils/catchAsync");
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
}
exports.CityController = CityController;
//# sourceMappingURL=city.controller.js.map