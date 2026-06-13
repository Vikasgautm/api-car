"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportController = void 0;
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const import_service_1 = require("../services/import.service");
const import_reprocess_service_1 = require("../services/import-reprocess.service");
class ImportController {
    static previewCarImport = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { url } = req.body;
        const userId = req.user?.user_id || 'admin';
        console.log(`[Car Import] Importing car data from URL: ${url} (requested by user: ${userId})`);
        const result = await import_service_1.ImportService.previewCarImport(url, userId);
        console.log(`[Car Import] Successfully imported car data from URL: ${url}`);
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
    // Re-process a single variant through the current SPEC_LABEL_MAP.
    static reprocessVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant_id = Array.isArray(req.params.variant_id) ? req.params.variant_id[0] : req.params.variant_id;
        const result = await import_reprocess_service_1.ImportReprocessService.reprocessVariant(variant_id);
        if (!result) {
            return response_util_1.ResponseUtil.notFound(res, 'Variant not found or has no import history');
        }
        return response_util_1.ResponseUtil.success(res, result, 'Variant reprocessed successfully');
    });
    // Re-process all variants of a car.
    static reprocessCar = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const car_id = Array.isArray(req.params.car_id) ? req.params.car_id[0] : req.params.car_id;
        const results = await import_reprocess_service_1.ImportReprocessService.reprocessCar(car_id);
        return response_util_1.ResponseUtil.success(res, {
            car_id,
            total: results.length,
            changed: results.filter(r => r.changed).length,
            results: results.filter(r => r.changed), // Only show the changed ones
        }, 'Car variants reprocessed successfully');
    });
    // Re-process ALL variants in the system (warning: heavy operation).
    static reprocessAll = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await import_reprocess_service_1.ImportReprocessService.reprocessAll();
        return response_util_1.ResponseUtil.success(res, result, 'All variants reprocessed successfully');
    });
}
exports.ImportController = ImportController;
//# sourceMappingURL=import.controller.js.map