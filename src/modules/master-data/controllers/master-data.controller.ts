import { NextFunction, Request, Response } from 'express';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { MasterDataService } from '../services/master-data.service';

export class MasterDataController {
  // GET /master-data/admin/categories
  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await MasterDataService.getCategories();
      return ResponseUtil.success(res, categories);
    } catch (err) { next(err); }
  }

  // GET /master-data/admin/options/:categoryKey
  static async getOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const categoryKey = req.params['categoryKey'] as string;
      const includeInactive = req.query.include_inactive === 'true';
      const options = await MasterDataService.getOptions(categoryKey, includeInactive);
      return ResponseUtil.success(res, options);
    } catch (err) { next(err); }
  }

  // GET /master-data/admin/all
  static async getAllOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const all = await MasterDataService.getAllActiveOptions();
      return ResponseUtil.success(res, all);
    } catch (err) { next(err); }
  }

  // POST /master-data/admin/options/:categoryKey
  static async createOption(req: Request, res: Response, next: NextFunction) {
    try {
      const categoryKey = req.params['categoryKey'] as string;
      const opt = await MasterDataService.createOption(categoryKey, req.body);
      return ResponseUtil.created(res, opt);
    } catch (err) { next(err); }
  }

  // PUT /master-data/admin/options/:categoryKey/:optionId
  static async updateOption(req: Request, res: Response, next: NextFunction) {
    try {
      const optionId = req.params['optionId'] as string;
      const opt = await MasterDataService.updateOption(optionId, req.body);
      return ResponseUtil.success(res, opt);
    } catch (err) { next(err); }
  }

  // DELETE /master-data/admin/options/:categoryKey/:optionId
  static async deleteOption(req: Request, res: Response, next: NextFunction) {
    try {
      const optionId = req.params['optionId'] as string;
      await MasterDataService.deleteOption(optionId);
      return ResponseUtil.success(res, { deleted: true });
    } catch (err) { next(err); }
  }

  // PATCH /master-data/admin/options/:categoryKey/:optionId/toggle
  static async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const optionId = req.params['optionId'] as string;
      const opt = await MasterDataService.toggleActive(optionId);
      return ResponseUtil.success(res, opt);
    } catch (err) { next(err); }
  }

  // PATCH /master-data/admin/options/:categoryKey/reorder
  static async reorderOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const categoryKey = req.params['categoryKey'] as string;
      const { ordered_ids } = req.body;
      if (!Array.isArray(ordered_ids)) {
        return res.status(400).json({ success: false, message: 'ordered_ids must be an array' });
      }
      await MasterDataService.reorderOptions(categoryKey, ordered_ids);
      return ResponseUtil.success(res, { reordered: true });
    } catch (err) { next(err); }
  }

  // POST /master-data/admin/seed
  static async seedDefaults(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MasterDataService.seedDefaults();
      return ResponseUtil.success(res, result);
    } catch (err) { next(err); }
  }
}
