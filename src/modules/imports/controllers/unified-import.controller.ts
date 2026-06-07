import { Request, Response } from 'express';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { AppError } from '../../../shared/utils/app-error.util';
import { catchAsync } from '../../../utils/catchAsync';
import { UnifiedImportService } from '../services/unified-import.service';
import { AVAILABLE_TARGET_FIELD_GROUPS } from '../constants/available-target-fields';

export class UnifiedImportController {
  /**
   * POST /imports/unified/preview
   * Accepts { source, carUrl, variantUrl } and returns a combined preview
   * with matched fields, unmatched fields (with suggestions), and availableTargetFields.
   */
  static unifiedPreview = catchAsync(async (req: Request, res: Response) => {
    const { source, carUrl, variantUrls } = req.body;
    const userId = (req as any).user?.user_id || 'admin';

    if (!source) throw new AppError('source is required (carwale or cardekho)', 400);
    if (!['carwale', 'cardekho'].includes(source)) {
      throw new AppError('Invalid source. Must be "carwale" or "cardekho".', 400);
    }
    const urls: string[] = Array.isArray(variantUrls) ? variantUrls.filter(Boolean) : [];
    if (!carUrl && urls.length === 0) {
      throw new AppError('At least one of carUrl or variantUrls is required.', 400);
    }

    const result = await UnifiedImportService.unifiedPreview(source, carUrl, urls, userId);
    return ResponseUtil.success(res, result, 'Import preview generated successfully');
  });

  /**
   * POST /imports/unified/save
   * Accepts full save payload with manual mappings and ignored keys.
   */
  static unifiedSave = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const userId = (req as any).user?.user_id || 'admin';

    if (!payload.source) throw new AppError('source is required', 400);
    if (!payload.car && !(payload.variants && payload.variants.length > 0)) {
      throw new AppError('At least one of car or variants payload is required.', 400);
    }

    const result = await UnifiedImportService.unifiedSave(payload, userId);
    return ResponseUtil.created(res, result, 'Import saved successfully');
  });

  /**
   * GET /imports/available-fields
   * Returns all available target fields grouped by section.
   */
  static getAvailableFields = catchAsync(async (_req: Request, res: Response) => {
    return ResponseUtil.success(res, AVAILABLE_TARGET_FIELD_GROUPS, 'Available target fields retrieved');
  });

  /**
   * GET /imports/key-mappings
   * Returns all saved admin key mappings, optionally filtered by source/model.
   */
  static getKeyMappings = catchAsync(async (req: Request, res: Response) => {
    const { source, target_model } = req.query as any;
    const mappings = await UnifiedImportService.getKeyMappings(source, target_model);
    return ResponseUtil.success(res, mappings, 'Key mappings retrieved');
  });

  /**
   * DELETE /imports/key-mappings/:mapping_id
   * Deactivates a saved key mapping.
   */
  static deleteKeyMapping = catchAsync(async (req: Request, res: Response) => {
    const mapping_id = Array.isArray(req.params.mapping_id) ? req.params.mapping_id[0] : req.params.mapping_id;
    const result = await UnifiedImportService.deleteKeyMapping(mapping_id);
    if (!result) throw new AppError('Key mapping not found', 404);
    return ResponseUtil.success(res, result, 'Key mapping deactivated');
  });
}
