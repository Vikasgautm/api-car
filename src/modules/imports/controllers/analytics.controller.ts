import { Request, Response } from 'express';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { UnmatchedKeysAnalyticsService } from '../services/unmatched-keys-analytics.service';
import { MultiSourceVariantService } from '../services/multi-source-variant.service';
import { ImportConfidenceService } from '../services/import-confidence.service';
import { EnumStandardizerService } from '../services/enum-standardizer.service';

export class AnalyticsController {
  static getUnmatchedKeyFrequency = catchAsync(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const result = await UnmatchedKeysAnalyticsService.getUnmatchedKeyFrequency(limit);
    return ResponseUtil.success(
      res,
      result,
      'Unmatched key frequency analysis retrieved successfully'
    );
  });

  static getFrequencyBySource = catchAsync(async (req: Request, res: Response) => {
    const source = (req.query.source as string) || 'cardekho';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const result = await UnmatchedKeysAnalyticsService.getFrequencyBySource(source, limit);
    return ResponseUtil.success(
      res,
      result,
      `Unmatched key frequency for source '${source}' retrieved successfully`
    );
  });

  static getFrequencyByImportType = catchAsync(async (req: Request, res: Response) => {
    const importType = (req.query.type as string) as 'car' | 'variant';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    if (!importType || !['car', 'variant'].includes(importType)) {
      return ResponseUtil.badRequest(
        res,
        'Import type must be either "car" or "variant"'
      );
    }

    const result = await UnmatchedKeysAnalyticsService.getFrequencyByImportType(importType, limit);
    return ResponseUtil.success(
      res,
      result,
      `Unmatched key frequency for import type '${importType}' retrieved successfully`
    );
  });

  static consolidateVariantFromSources = catchAsync(async (req: Request, res: Response) => {
    const variant_id = Array.isArray(req.params.variant_id) ? req.params.variant_id[0] : req.params.variant_id;

    const result = await MultiSourceVariantService.consolidateFromMultipleSources(variant_id);
    return ResponseUtil.success(
      res,
      result,
      'Variant consolidated from multiple sources successfully'
    );
  });

  static getVariantSourceHistory = catchAsync(async (req: Request, res: Response) => {
    const variant_id = Array.isArray(req.params.variant_id) ? req.params.variant_id[0] : req.params.variant_id;

    const sources = await MultiSourceVariantService.getSourceHistory(variant_id);
    return ResponseUtil.success(
      res,
      { variant_id, sources },
      'Variant source history retrieved successfully'
    );
  });

  static getImportConfidenceScore = catchAsync(async (req: Request, res: Response) => {
    const import_id = Array.isArray(req.params.import_id) ? req.params.import_id[0] : req.params.import_id;

    const score = await ImportConfidenceService.scoreImport(import_id);
    return ResponseUtil.success(
      res,
      score,
      'Import confidence score calculated successfully'
    );
  });

  static getVariantConfidenceScores = catchAsync(async (req: Request, res: Response) => {
    const variant_id = Array.isArray(req.params.variant_id) ? req.params.variant_id[0] : req.params.variant_id;

    const scores = await ImportConfidenceService.scoreVariantImports(variant_id);
    return ResponseUtil.success(
      res,
      { variant_id, scores },
      'Variant import confidence scores retrieved successfully'
    );
  });

  static getCarConfidenceScores = catchAsync(async (req: Request, res: Response) => {
    const car_id = Array.isArray(req.params.car_id) ? req.params.car_id[0] : req.params.car_id;

    const scores = await ImportConfidenceService.scoreCarImports(car_id);
    return ResponseUtil.success(
      res,
      { car_id, scores },
      'Car import confidence scores retrieved successfully'
    );
  });

  static getBatchQualityReport = catchAsync(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

    const report = await ImportConfidenceService.getBatchQualityReport(limit);
    return ResponseUtil.success(
      res,
      report,
      'Batch quality report retrieved successfully'
    );
  });

  static getStandardizationReport = catchAsync(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const report = await EnumStandardizerService.getStandardizationReport(limit);
    return ResponseUtil.success(
      res,
      report,
      'Enum standardization report retrieved successfully'
    );
  });
}
