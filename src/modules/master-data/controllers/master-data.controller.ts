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

  // ── Unknown Value Queue ───────────────────────────────────────────────────────

  // GET /master-data/admin/unknown-values?resolved=false
  static async getUnknownValues(req: Request, res: Response, next: NextFunction) {
    try {
      const resolved = req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined;
      const records = await MasterDataService.getUnknownValues(resolved);
      return ResponseUtil.success(res, records);
    } catch (err) { next(err); }
  }

  // PATCH /master-data/admin/unknown-values/:unknownId/resolve
  static async resolveUnknownValue(req: Request, res: Response, next: NextFunction) {
    try {
      const unknownId = req.params['unknownId'] as string;
      const { target_option_value } = req.body;
      if (!target_option_value) return res.status(400).json({ success: false, message: 'target_option_value is required' });
      const record = await MasterDataService.resolveUnknownValue(unknownId, target_option_value);
      return ResponseUtil.success(res, record);
    } catch (err) { next(err); }
  }

  // PATCH /master-data/admin/unknown-values/:unknownId/dismiss
  static async dismissUnknownValue(req: Request, res: Response, next: NextFunction) {
    try {
      const unknownId = req.params['unknownId'] as string;
      await MasterDataService.dismissUnknownValue(unknownId);
      return ResponseUtil.success(res, { dismissed: true });
    } catch (err) { next(err); }
  }

  // POST /master-data/admin/unknown-values/:unknownId/promote
  static async promoteUnknownToMaster(req: Request, res: Response, next: NextFunction) {
    try {
      const unknownId = req.params['unknownId'] as string;
      const option = await MasterDataService.promoteUnknownToMaster(unknownId);
      return ResponseUtil.created(res, option);
    } catch (err) { next(err); }
  }
}
