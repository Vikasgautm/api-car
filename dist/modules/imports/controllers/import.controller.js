"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportController = void 0;
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const import_service_1 = require("../services/import.service");
class ImportController {
    static previewCarImport = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { url } = req.body;
        const userId = req.user?.user_id || 'admin';
        const result = await import_service_1.ImportService.previewCarImport(url, userId);
        return response_util_1.ResponseUtil.created(res, result, 'Car import preview generated successfully');
    });
    static saveCarImport = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const payload = req.body;
        const userId = req.user?.user_id || 'admin';
        const result = await import_service_1.ImportService.saveCarImport(payload, userId);
        return response_util_1.ResponseUtil.created(res, result, 'Car import saved successfully');
    });
    static previewVariantImport = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { car_id, urls } = req.body;
        const userId = req.user?.user_id || 'admin';
        const result = await import_service_1.ImportService.previewVariantImport(car_id, urls, userId);
        return response_util_1.ResponseUtil.created(res, result, 'Variant import preview generated successfully');
    });
    static saveVariantImport = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const payload = req.body;
        const userId = req.user?.user_id || 'admin';
        const result = await import_service_1.ImportService.saveVariantImport(payload, userId);
        return response_util_1.ResponseUtil.created(res, result, 'Variant import saved successfully');
    });
    static getImportLogs = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user?.user_id || 'admin';
        const filter = req.query;
        const logs = await import_service_1.ImportService.getImportLogs(userId, filter);
        return response_util_1.ResponseUtil.success(res, logs, 'Import logs retrieved successfully');
    });
}
exports.ImportController = ImportController;
//# sourceMappingURL=import.controller.js.map