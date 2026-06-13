import { Request, Response } from 'express';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { ImportService } from '../services/import.service';
import { ImportReprocessService } from '../services/import-reprocess.service';

export class ImportController {
  static previewCarImport = catchAsync(async (req: Request, res: Response) => {
    const { url } = req.body;
    const userId = (req as any).user?.user_id || 'admin';

    console.log(`[Car Import] Importing car data from URL: ${url} (requested by user: ${userId})`);

    const result = await ImportService.previewCarImport(url, userId);

    console.log(`[Car Import] Successfully imported car data from URL: ${url}`);
    return ResponseUtil.created(res, result, 'Car import preview generated successfully');
  });

  static saveCarImport = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const userId = (req as any).user?.user_id || 'admin';

    const result = await ImportService.saveCarImport(payload, userId);
    return ResponseUtil.created(res, result, 'Car import saved successfully');
  });

  static previewVariantImport = catchAsync(async (req: Request, res: Response) => {
    const { car_id, urls } = req.body;
    const userId = (req as any).user?.user_id || 'admin';

    const result = await ImportService.previewVariantImport(car_id, urls, userId);
    return ResponseUtil.created(res, result, 'Variant import preview generated successfully');
  });

  static saveVariantImport = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const userId = (req as any).user?.user_id || 'admin';

    const result = await ImportService.saveVariantImport(payload, userId);
    return ResponseUtil.created(res, result, 'Variant import saved successfully');
  });

  static getImportLogs = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.user_id || 'admin';
    const filter = req.query;

    const logs = await ImportService.getImportLogs(userId, filter);
    return ResponseUtil.success(res, logs, 'Import logs retrieved successfully');
  });

  // Re-process a single variant through the current SPEC_LABEL_MAP.
  static reprocessVariant = catchAsync(async (req: Request, res: Response) => {
    const variant_id = Array.isArray(req.params.variant_id) ? req.params.variant_id[0] : req.params.variant_id;

    const result = await ImportReprocessService.reprocessVariant(variant_id);
    if (!result) {
      return ResponseUtil.notFound(res, 'Variant not found or has no import history');
    }

    return ResponseUtil.success(res, result, 'Variant reprocessed successfully');
  });

  // Re-process all variants of a car.
  static reprocessCar = catchAsync(async (req: Request, res: Response) => {
    const car_id = Array.isArray(req.params.car_id) ? req.params.car_id[0] : req.params.car_id;

    const results = await ImportReprocessService.reprocessCar(car_id);
    return ResponseUtil.success(res, {
      car_id,
      total: results.length,
      changed: results.filter(r => r.changed).length,
      results: results.filter(r => r.changed), // Only show the changed ones
    }, 'Car variants reprocessed successfully');
  });

  // Re-process ALL variants in the system (warning: heavy operation).
  static reprocessAll = catchAsync(async (req: Request, res: Response) => {
    const result = await ImportReprocessService.reprocessAll();
    return ResponseUtil.success(res, result, 'All variants reprocessed successfully');
  });
}
