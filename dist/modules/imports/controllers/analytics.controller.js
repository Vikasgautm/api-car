"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const unmatched_keys_analytics_service_1 = require("../services/unmatched-keys-analytics.service");
const multi_source_variant_service_1 = require("../services/multi-source-variant.service");
const import_confidence_service_1 = require("../services/import-confidence.service");
const enum_standardizer_service_1 = require("../services/enum-standardizer.service");
class AnalyticsController {
    static getUnmatchedKeyFrequency = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
        const result = await unmatched_keys_analytics_service_1.UnmatchedKeysAnalyticsService.getUnmatchedKeyFrequency(limit);
        return response_util_1.ResponseUtil.success(res, result, 'Unmatched key frequency analysis retrieved successfully');
    });
    static getFrequencyBySource = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const source = req.query.source || 'cardekho';
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
        const result = await unmatched_keys_analytics_service_1.UnmatchedKeysAnalyticsService.getFrequencyBySource(source, limit);
        return response_util_1.ResponseUtil.success(res, result, `Unmatched key frequency for source '${source}' retrieved successfully`);
    });
    static getFrequencyByImportType = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const importType = req.query.type;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
        if (!importType || !['car', 'variant'].includes(importType)) {
            return response_util_1.ResponseUtil.badRequest(res, 'Import type must be either "car" or "variant"');
        }
        const result = await unmatched_keys_analytics_service_1.UnmatchedKeysAnalyticsService.getFrequencyByImportType(importType, limit);
        return response_util_1.ResponseUtil.success(res, result, `Unmatched key frequency for import type '${importType}' retrieved successfully`);
    });
    static consolidateVariantFromSources = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant_id = Array.isArray(req.params.variant_id) ? req.params.variant_id[0] : req.params.variant_id;
        const result = await multi_source_variant_service_1.MultiSourceVariantService.consolidateFromMultipleSources(variant_id);
        return response_util_1.ResponseUtil.success(res, result, 'Variant consolidated from multiple sources successfully');
    });
    static getVariantSourceHistory = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant_id = Array.isArray(req.params.variant_id) ? req.params.variant_id[0] : req.params.variant_id;
        const sources = await multi_source_variant_service_1.MultiSourceVariantService.getSourceHistory(variant_id);
        return response_util_1.ResponseUtil.success(res, { variant_id, sources }, 'Variant source history retrieved successfully');
    });
    static getImportConfidenceScore = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const import_id = Array.isArray(req.params.import_id) ? req.params.import_id[0] : req.params.import_id;
        const score = await import_confidence_service_1.ImportConfidenceService.scoreImport(import_id);
        return response_util_1.ResponseUtil.success(res, score, 'Import confidence score calculated successfully');
    });
    static getVariantConfidenceScores = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const variant_id = Array.isArray(req.params.variant_id) ? req.params.variant_id[0] : req.params.variant_id;
        const scores = await import_confidence_service_1.ImportConfidenceService.scoreVariantImports(variant_id);
        return response_util_1.ResponseUtil.success(res, { variant_id, scores }, 'Variant import confidence scores retrieved successfully');
    });
    static getCarConfidenceScores = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const car_id = Array.isArray(req.params.car_id) ? req.params.car_id[0] : req.params.car_id;
        const scores = await import_confidence_service_1.ImportConfidenceService.scoreCarImports(car_id);
        return response_util_1.ResponseUtil.success(res, { car_id, scores }, 'Car import confidence scores retrieved successfully');
    });
    static getBatchQualityReport = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
        const report = await import_confidence_service_1.ImportConfidenceService.getBatchQualityReport(limit);
        return response_util_1.ResponseUtil.success(res, report, 'Batch quality report retrieved successfully');
    });
    static getStandardizationReport = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
        const report = await enum_standardizer_service_1.EnumStandardizerService.getStandardizationReport(limit);
        return response_util_1.ResponseUtil.success(res, report, 'Enum standardization report retrieved successfully');
    });
}
exports.AnalyticsController = AnalyticsController;
