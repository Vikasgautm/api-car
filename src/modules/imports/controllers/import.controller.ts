import { Request, Response } from 'express';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { ImportService } from '../services/import.service';

export class ImportController {
  static previewCarImport = catchAsync(async (req: Request, res: Response) => {
    const { url } = req.body;
    const userId = (req as any).user?.user_id || 'admin';

    const result = await ImportService.previewCarImport(url, userId);
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
}
