"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportController = void 0;
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const import_service_1 = require("../services/import.service");
const console_1 = __importDefault(require("console"));
class ImportController {
    static async previewCarImport(req, res) {
        try {
            const { url } = req.body;
            const userId = req.user?.user_id || 'admin';
            const result = await import_service_1.ImportService.previewCarImport(url, userId);
            res.status(201).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            if (error instanceof app_error_util_1.AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: error.message || 'Failed to preview car import',
                });
            }
        }
    }
    static async saveCarImport(req, res) {
        try {
            const payload = req.body;
            const userId = req.user?.user_id || 'admin';
            const result = await import_service_1.ImportService.saveCarImport(payload, userId);
            res.status(201).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            if (error instanceof app_error_util_1.AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: error.message || 'Failed to save car import',
                });
            }
        }
    }
    static async previewVariantImport(req, res) {
        try {
            const { car_id, urls } = req.body;
            const userId = req.user?.user_id || 'admin';
            const result = await import_service_1.ImportService.previewVariantImport(car_id, urls, userId);
            res.status(201).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            if (error instanceof app_error_util_1.AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: error.message || 'Failed to preview variant import',
                });
            }
        }
    }
    static async saveVariantImport(req, res) {
        try {
            const payload = req.body;
            const userId = req.user?.user_id || 'admin';
            const result = await import_service_1.ImportService.saveVariantImport(payload, userId);
            console_1.default.log(result, "result");
            res.status(201).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            console_1.default.log(error, "error");
            if (error instanceof app_error_util_1.AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: error.message || 'Failed to save variant import',
                });
            }
        }
    }
    static async getImportLogs(req, res) {
        try {
            const userId = req.user?.user_id || 'admin';
            const filter = req.query;
            const logs = await import_service_1.ImportService.getImportLogs(userId, filter);
            res.status(200).json({
                success: true,
                data: logs,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch import logs',
            });
        }
    }
}
exports.ImportController = ImportController;
//# sourceMappingURL=import.controller.js.map