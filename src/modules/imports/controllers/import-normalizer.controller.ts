/**
 * Import Normalizer Controller
 * Test and integrate the normalization engine
 */

import { Request, Response } from 'express';
import { ImportNormalizerService } from '../services/import-normalizer.service';
import { PowertrainDetectorService } from '../../variants/services/powertrain-detector.service';
import { AppError } from '../../../shared/utils/app-error.util';

export class ImportNormalizerController {
  /**
   * POST /admin/imports/normalize
   * Test normalization on raw specs
   */
  static async normalizeSpecs(req: Request, res: Response) {
    try {
      const { specs_raw, fuel_type_slug } = req.body;

      if (!specs_raw || typeof specs_raw !== 'object') {
        throw new AppError('specs_raw must be provided as an object', 400);
      }

      // Normalize
      const normalizationReport = ImportNormalizerService.normalize(specs_raw);

      // Detect powertrain
      const powertrainFlags = PowertrainDetectorService.detect(
        normalizationReport.specs_normalized,
        fuel_type_slug
      );

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
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      } else {
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
  static async detectPowertrain(req: Request, res: Response) {
    try {
      const { specs_normalized, fuel_type_slug } = req.body;

      const powertrainFlags = PowertrainDetectorService.detect(specs_normalized, fuel_type_slug);

      res.status(200).json({
        success: true,
        data: powertrainFlags,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Powertrain detection failed',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
