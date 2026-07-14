"use strict";
/**
 * Import Normalizer Controller
 * Test and integrate the normalization engine
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportNormalizerController = void 0;
const import_normalizer_service_1 = require("../services/import-normalizer.service");
const powertrain_detector_service_1 = require("../../variants/services/powertrain-detector.service");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
class ImportNormalizerController {
    /**
     * POST /admin/imports/normalize
     * Test normalization on raw specs
     */
    static async normalizeSpecs(req, res) {
        try {
            const { specs_raw, fuel_type_slug } = req.body;
            if (!specs_raw || typeof specs_raw !== 'object') {
                throw new app_error_util_1.AppError('specs_raw must be provided as an object', 400);
            }
            // Normalize
            const normalizationReport = import_normalizer_service_1.ImportNormalizerService.normalize(specs_raw);
            // Detect powertrain
            const powertrainFlags = powertrain_detector_service_1.PowertrainDetectorService.detect(normalizationReport.specs_normalized, fuel_type_slug);
            res.status(200).json({
                success: true,
                data: {
                    specs_normalized: normalizationReport.specs_normalized,
                    powertrain_flags: powertrainFlags,
                    normalization_stats: normalizationReport.normalization_stats,
                    unmapped_keys: normalizationReport.unmapped_keys,
                    mapping_details: normalizationReport.mapping_details,
                },
            });
        }
        catch (error) {
            if (error instanceof app_error_util_1.AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    error: error.message,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: 'Normalization failed',
                    details: error instanceof Error ? error.message : String(error),
                });
            }
        }
    }
    /**
     * POST /admin/imports/detect-powertrain
     * Detect powertrain capabilities from specs
     */
    static async detectPowertrain(req, res) {
        try {
            const { specs_normalized, fuel_type_slug } = req.body;
            const powertrainFlags = powertrain_detector_service_1.PowertrainDetectorService.detect(specs_normalized, fuel_type_slug);
            res.status(200).json({
                success: true,
                data: powertrainFlags,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Powertrain detection failed',
                details: error instanceof Error ? error.message : String(error),
            });
        }
    }
}
exports.ImportNormalizerController = ImportNormalizerController;
