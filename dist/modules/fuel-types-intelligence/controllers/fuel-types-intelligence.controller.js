"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuelTypesIntelligenceController = void 0;
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const fuel_types_intelligence_service_1 = require("../services/fuel-types-intelligence.service");
class FuelTypesIntelligenceController {
    static getSummary = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const data = await fuel_types_intelligence_service_1.FuelTypesIntelligenceService.getSummary();
        return response_util_1.ResponseUtil.success(res, data, 'Fuel type summary retrieved');
    });
    static getBrands = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const data = await fuel_types_intelligence_service_1.FuelTypesIntelligenceService.getBrands();
        return response_util_1.ResponseUtil.success(res, data, 'Brand fuel distribution retrieved');
    });
    static getBodyTypes = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const data = await fuel_types_intelligence_service_1.FuelTypesIntelligenceService.getBodyTypes();
        return response_util_1.ResponseUtil.success(res, data, 'Fuel body type distribution retrieved');
    });
    static getBudget = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const data = await fuel_types_intelligence_service_1.FuelTypesIntelligenceService.getBudget();
        return response_util_1.ResponseUtil.success(res, data, 'Fuel budget distribution retrieved');
    });
    static getBrandBodyBudget = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const data = await fuel_types_intelligence_service_1.FuelTypesIntelligenceService.getBrandBodyBudget();
        return response_util_1.ResponseUtil.success(res, data, 'Brand fuel body budget matrix retrieved');
    });
    static getSeating = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const data = await fuel_types_intelligence_service_1.FuelTypesIntelligenceService.getSeating();
        return response_util_1.ResponseUtil.success(res, data, 'Fuel seating distribution retrieved');
    });
    static getLifecycle = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const data = await fuel_types_intelligence_service_1.FuelTypesIntelligenceService.getLifecycle();
        return response_util_1.ResponseUtil.success(res, data, 'Fuel lifecycle distribution retrieved');
    });
    static getHealth = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const data = await fuel_types_intelligence_service_1.FuelTypesIntelligenceService.getHealth();
        return response_util_1.ResponseUtil.success(res, data, 'Fuel health issues retrieved');
    });
    static getMultiFuel = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const data = await fuel_types_intelligence_service_1.FuelTypesIntelligenceService.getMultiFuel();
        return response_util_1.ResponseUtil.success(res, data, 'Multi-fuel models retrieved');
    });
}
exports.FuelTypesIntelligenceController = FuelTypesIntelligenceController;
