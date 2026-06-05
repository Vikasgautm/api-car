"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterDataController = void 0;
const response_util_1 = require("../../../shared/utils/response.util");
const master_data_service_1 = require("../services/master-data.service");
class MasterDataController {
    // GET /master-data/admin/categories
    static async getCategories(req, res, next) {
        try {
            const categories = await master_data_service_1.MasterDataService.getCategories();
            return response_util_1.ResponseUtil.success(res, categories);
        }
        catch (err) {
            next(err);
        }
    }
    // GET /master-data/admin/options/:categoryKey
    static async getOptions(req, res, next) {
        try {
            const categoryKey = req.params['categoryKey'];
            const includeInactive = req.query.include_inactive === 'true';
            const options = await master_data_service_1.MasterDataService.getOptions(categoryKey, includeInactive);
            return response_util_1.ResponseUtil.success(res, options);
        }
        catch (err) {
            next(err);
        }
    }
    // GET /master-data/admin/all
    static async getAllOptions(req, res, next) {
        try {
            const all = await master_data_service_1.MasterDataService.getAllActiveOptions();
            return response_util_1.ResponseUtil.success(res, all);
        }
        catch (err) {
            next(err);
        }
    }
    // POST /master-data/admin/options/:categoryKey
    static async createOption(req, res, next) {
        try {
            const categoryKey = req.params['categoryKey'];
            const opt = await master_data_service_1.MasterDataService.createOption(categoryKey, req.body);
            return response_util_1.ResponseUtil.created(res, opt);
        }
        catch (err) {
            next(err);
        }
    }
    // PUT /master-data/admin/options/:categoryKey/:optionId
    static async updateOption(req, res, next) {
        try {
            const optionId = req.params['optionId'];
            const opt = await master_data_service_1.MasterDataService.updateOption(optionId, req.body);
            return response_util_1.ResponseUtil.success(res, opt);
        }
        catch (err) {
            next(err);
        }
    }
    // DELETE /master-data/admin/options/:categoryKey/:optionId
    static async deleteOption(req, res, next) {
        try {
            const optionId = req.params['optionId'];
            await master_data_service_1.MasterDataService.deleteOption(optionId);
            return response_util_1.ResponseUtil.success(res, { deleted: true });
        }
        catch (err) {
            next(err);
        }
    }
    // PATCH /master-data/admin/options/:categoryKey/:optionId/toggle
    static async toggleActive(req, res, next) {
        try {
            const optionId = req.params['optionId'];
            const opt = await master_data_service_1.MasterDataService.toggleActive(optionId);
            return response_util_1.ResponseUtil.success(res, opt);
        }
        catch (err) {
            next(err);
        }
    }
    // PATCH /master-data/admin/options/:categoryKey/reorder
    static async reorderOptions(req, res, next) {
        try {
            const categoryKey = req.params['categoryKey'];
            const { ordered_ids } = req.body;
            if (!Array.isArray(ordered_ids)) {
                return res.status(400).json({ success: false, message: 'ordered_ids must be an array' });
            }
            await master_data_service_1.MasterDataService.reorderOptions(categoryKey, ordered_ids);
            return response_util_1.ResponseUtil.success(res, { reordered: true });
        }
        catch (err) {
            next(err);
        }
    }
    // POST /master-data/admin/seed
    static async seedDefaults(req, res, next) {
        try {
            const result = await master_data_service_1.MasterDataService.seedDefaults();
            return response_util_1.ResponseUtil.success(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    // ── Unknown Value Queue ───────────────────────────────────────────────────────
    // GET /master-data/admin/unknown-values?resolved=false
    static async getUnknownValues(req, res, next) {
        try {
            const resolved = req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined;
            const records = await master_data_service_1.MasterDataService.getUnknownValues(resolved);
            return response_util_1.ResponseUtil.success(res, records);
        }
        catch (err) {
            next(err);
        }
    }
    // PATCH /master-data/admin/unknown-values/:unknownId/resolve
    static async resolveUnknownValue(req, res, next) {
        try {
            const unknownId = req.params['unknownId'];
            const { target_option_value } = req.body;
            if (!target_option_value)
                return res.status(400).json({ success: false, message: 'target_option_value is required' });
            const record = await master_data_service_1.MasterDataService.resolveUnknownValue(unknownId, target_option_value);
            return response_util_1.ResponseUtil.success(res, record);
        }
        catch (err) {
            next(err);
        }
    }
    // PATCH /master-data/admin/unknown-values/:unknownId/dismiss
    static async dismissUnknownValue(req, res, next) {
        try {
            const unknownId = req.params['unknownId'];
            await master_data_service_1.MasterDataService.dismissUnknownValue(unknownId);
            return response_util_1.ResponseUtil.success(res, { dismissed: true });
        }
        catch (err) {
            next(err);
        }
    }
    // POST /master-data/admin/unknown-values/:unknownId/promote
    static async promoteUnknownToMaster(req, res, next) {
        try {
            const unknownId = req.params['unknownId'];
            const option = await master_data_service_1.MasterDataService.promoteUnknownToMaster(unknownId);
            return response_util_1.ResponseUtil.created(res, option);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.MasterDataController = MasterDataController;
//# sourceMappingURL=master-data.controller.js.map