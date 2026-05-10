import { Request, Response } from 'express';
import { AppError } from '../../../shared/utils/app-error.util';
import { ImportService } from '../services/import.service';
import console from 'console';

export class ImportController {
  static async previewCarImport(req: Request, res: Response) {
    try {
      const { url } = req.body;
      const userId = (req as any).user?.user_id || 'admin';

      const result = await ImportService.previewCarImport(url, userId);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to preview car import',
        });
      }
    }
  }

  static async saveCarImport(req: Request, res: Response) {
    try {
      const payload = req.body;
      const userId = (req as any).user?.user_id || 'admin';

      const result = await ImportService.saveCarImport(payload, userId);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to save car import',
        });
      }
    }
  }

  static async previewVariantImport(req: Request, res: Response) {
    try {
      const { car_id, urls } = req.body;
      const userId = (req as any).user?.user_id || 'admin';

      const result = await ImportService.previewVariantImport(car_id, urls, userId);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to preview variant import',
        });
      }
    }
  }

  static async saveVariantImport(req: Request, res: Response) {
    try {
      const payload = req.body;
      const userId = (req as any).user?.user_id || 'admin';

      const result = await ImportService.saveVariantImport(payload, userId);
      console.log(result, "result");
      
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.log(error, "error");
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to save variant import',
        });
      }
    }
  }

  static async getImportLogs(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.user_id || 'admin';
      const filter = req.query;

      const logs = await ImportService.getImportLogs(userId, filter);

      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch import logs',
      });
    }
  }
}
