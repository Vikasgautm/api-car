"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedImportController = void 0;
const response_util_1 = require("../../../shared/utils/response.util");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const unified_import_service_1 = require("../services/unified-import.service");
const available_target_fields_1 = require("../constants/available-target-fields");
class UnifiedImportController {
    /**
     * POST /imports/unified/preview
     * Accepts { source, carUrl, variantUrl } and returns a combined preview
     * with matched fields, unmatched fields (with suggestions), and availableTargetFields.
     */
    static unifiedPreview = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { source, carUrl, variantUrls } = req.body;
        const userId = req.user?.user_id || 'admin';
        if (!source)
            throw new app_error_util_1.AppError('source is required (carwale or cardekho)', 400);
        if (!['carwale', 'cardekho'].includes(source)) {
            throw new app_error_util_1.AppError('Invalid source. Must be "carwale" or "cardekho".', 400);
        }
        const urls = Array.isArray(variantUrls) ? variantUrls.filter(Boolean) : [];
        if (!carUrl && urls.length === 0) {
            throw new app_error_util_1.AppError('At least one of carUrl or variantUrls is required.', 400);
        }
        console.log(`[Unified Import] Fetching data from "${source}" — carUrl: ${carUrl || 'none'}, variantUrls: ${urls.length} (requested by user: ${userId})`);
        const result = await unified_import_service_1.UnifiedImportService.unifiedPreview(source, carUrl, urls, userId);
        // What was extracted FROM the source (e.g. cardekho) — the raw scraped data
        console.log(`[Unified Import] Extracted from ${source} — car:`, JSON.stringify(result.car.extracted));
        result.variants.forEach((v, i) => {
            console.log(`[Unified Import] Extracted from ${source} — variant[${i}] "${v.fullName}":`, JSON.stringify(v.extracted));
        });
        // What we will SAVE into our schema — only the matched (mapped) fields
        console.log(`[Unified Import] Mapped to save — car matched: ${result.car.matched.length}, unmatched: ${result.car.unmatched.length}`);
        console.log(`[Unified Import] Car data to save:`, JSON.stringify(result.car.matched));
        result.variants.forEach((v, i) => {
            console.log(`[Unified Import] Variant[${i}] "${v.fullName}" to save — matched: ${v.matched.length}, unmatched: ${v.unmatched.length}`);
            console.log(`[Unified Import] Variant[${i}] data to save:`, JSON.stringify(v.matched));
        });
        return response_util_1.ResponseUtil.success(res, result, 'Import preview generated successfully');
    });
    /**
     * POST /imports/unified/save
     * Accepts full save payload with manual mappings and ignored keys.
     */
    static unifiedSave = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const payload = req.body;
        const userId = req.user?.user_id || 'admin';
        if (!payload.source)
            throw new app_error_util_1.AppError('source is required', 400);
        if (!payload.car && !(payload.variants && payload.variants.length > 0)) {
            throw new app_error_util_1.AppError('At least one of car or variants payload is required.', 400);
        }
        const result = await unified_import_service_1.UnifiedImportService.unifiedSave(payload, userId);
        if (result.errors.length > 0) {
            return res.status(422).json({
                success: false,
                message: `Import failed with ${result.errors.length} error(s). Fix the issues and try again.`,
                data: result,
                errors: result.errors,
                statusCode: 422,
                timestamp: new Date().toISOString(),
            });
        }
        return response_util_1.ResponseUtil.created(res, result, 'Import saved successfully');
    });
    /**
     * GET /imports/available-fields
     * Returns all available target fields grouped by section.
     */
    static getAvailableFields = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        return response_util_1.ResponseUtil.success(res, available_target_fields_1.AVAILABLE_TARGET_FIELD_GROUPS, 'Available target fields retrieved');
    });
    /**
     * GET /imports/key-mappings
     * Returns all saved admin key mappings, optionally filtered by source/model.
     */
    static getKeyMappings = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { source, target_model } = req.query;
        const mappings = await unified_import_service_1.UnifiedImportService.getKeyMappings(source, target_model);
        return response_util_1.ResponseUtil.success(res, mappings, 'Key mappings retrieved');
    });
    /**
     * DELETE /imports/key-mappings/:mapping_id
     * Deactivates a saved key mapping.
     */
    static deleteKeyMapping = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const mapping_id = Array.isArray(req.params.mapping_id) ? req.params.mapping_id[0] : req.params.mapping_id;
        const result = await unified_import_service_1.UnifiedImportService.deleteKeyMapping(mapping_id);
        if (!result)
            throw new app_error_util_1.AppError('Key mapping not found', 404);
        return response_util_1.ResponseUtil.success(res, result, 'Key mapping deactivated');
    });
}
exports.UnifiedImportController = UnifiedImportController;
