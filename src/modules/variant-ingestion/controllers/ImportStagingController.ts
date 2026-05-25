import { Request, Response } from 'express';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { VariantIngestionService } from '../services/VariantIngestionService';
import { VariantPushService } from '../services/VariantPushService';

export class ImportStagingController {
  // POST /admin/imports/preview
  static previewStaging = catchAsync(async (req: Request, res: Response) => {
    const { variants } = req.body;
    if (!Array.isArray(variants) || variants.length === 0) {
      return ResponseUtil.badRequest(res, 'variants array is required');
    }
    const preview = await VariantIngestionService.previewStaging(variants);
    return ResponseUtil.success(res, preview, 'Preview generated');
  });

  // POST /admin/imports/stage
  static createSession = catchAsync(async (req: Request, res: Response) => {
    const { session_name, source_name, variants } = req.body;
    const userId = (req as any).user?.user_id || 'admin';

    if (!session_name || !Array.isArray(variants) || variants.length === 0) {
      return ResponseUtil.badRequest(res, 'session_name and variants are required');
    }

    const result = await VariantIngestionService.createSession({
      session_name,
      source_name,
      imported_by: userId,
      variants,
    });
    return ResponseUtil.created(res, result, 'Import session created and variants staged');
  });

  // GET /admin/imports/sessions
  static getSessions = catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(String(req.query.page || 1));
    const limit = parseInt(String(req.query.limit || 20));
    const result = await VariantIngestionService.getSessions(page, limit);
    return ResponseUtil.success(res, result, 'Sessions retrieved');
  });

  // GET /admin/imports/sessions/:id
  static getSession = catchAsync(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const session = await VariantIngestionService.getSession(id);
    if (!session) return ResponseUtil.notFound(res, 'Session not found');
    return ResponseUtil.success(res, session, 'Session retrieved');
  });

  // GET /admin/imports
  static getStagingList = catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 50, ...filters } = req.query;
    const result = await VariantIngestionService.getStagingList(
      filters as Record<string, any>,
      parseInt(String(page)),
      parseInt(String(limit))
    );
    return ResponseUtil.success(res, result, 'Staging variants retrieved');
  });

  // GET /admin/imports/:id
  static getStagingVariant = catchAsync(async (req: Request, res: Response) => {
    const { VariantImportStaging } = await import('../models/VariantImportStaging');
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const doc = await VariantImportStaging.findById(id);
    if (!doc) return ResponseUtil.notFound(res, 'Staging variant not found');
    return ResponseUtil.success(res, doc, 'Staging variant retrieved');
  });

  // PATCH /admin/imports/:id/link-car
  static linkCar = catchAsync(async (req: Request, res: Response) => {
    const { car_id } = req.body;
    const userId = (req as any).user?.user_id || 'admin';
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!car_id) return ResponseUtil.badRequest(res, 'car_id is required');

    const result = await VariantIngestionService.linkCar(id, car_id, userId);
    return ResponseUtil.success(res, result, 'Car linked successfully');
  });

  // PATCH /admin/imports/bulk-link
  static bulkLinkCar = catchAsync(async (req: Request, res: Response) => {
    const { staging_ids, car_id } = req.body;
    const userId = (req as any).user?.user_id || 'admin';

    if (!Array.isArray(staging_ids) || !car_id) {
      return ResponseUtil.badRequest(res, 'staging_ids array and car_id are required');
    }

    const result = await VariantIngestionService.bulkLinkCar(staging_ids, car_id, userId);
    return ResponseUtil.success(res, result, 'Bulk car link applied');
  });

  // PATCH /admin/imports/bulk-validate
  static bulkValidate = catchAsync(async (req: Request, res: Response) => {
    const { staging_ids } = req.body;
    if (!Array.isArray(staging_ids) || staging_ids.length === 0) {
      return ResponseUtil.badRequest(res, 'staging_ids array is required');
    }
    const results = await VariantIngestionService.bulkValidate(staging_ids);
    return ResponseUtil.success(res, results, 'Validation complete');
  });

  // PATCH /admin/imports/bulk-review
  static bulkReview = catchAsync(async (req: Request, res: Response) => {
    const { staging_ids } = req.body;
    const userId = (req as any).user?.user_id || 'admin';
    if (!Array.isArray(staging_ids) || staging_ids.length === 0) {
      return ResponseUtil.badRequest(res, 'staging_ids array is required');
    }
    const result = await VariantIngestionService.bulkUpdateStatus(staging_ids, 'reviewed', userId);
    return ResponseUtil.success(res, result, 'Marked as reviewed');
  });

  // PATCH /admin/imports/bulk-ready
  static bulkMarkReady = catchAsync(async (req: Request, res: Response) => {
    const { staging_ids } = req.body;
    const userId = (req as any).user?.user_id || 'admin';
    if (!Array.isArray(staging_ids) || staging_ids.length === 0) {
      return ResponseUtil.badRequest(res, 'staging_ids array is required');
    }
    const result = await VariantIngestionService.bulkUpdateStatus(staging_ids, 'ready_to_push', userId);
    return ResponseUtil.success(res, result, 'Marked as ready to push');
  });

  // POST /admin/imports/bulk-push
  static bulkPush = catchAsync(async (req: Request, res: Response) => {
    const { staging_ids } = req.body;
    const userId = (req as any).user?.user_id || 'admin';
    if (!Array.isArray(staging_ids) || staging_ids.length === 0) {
      return ResponseUtil.badRequest(res, 'staging_ids array is required');
    }
    const results = await VariantPushService.pushBulk(staging_ids, userId);
    const pushed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    return ResponseUtil.success(res, { results, pushed, failed }, `Pushed ${pushed} variants, ${failed} failed`);
  });

  // PATCH /admin/imports/:id/reject
  static rejectVariant = catchAsync(async (req: Request, res: Response) => {
    const { reason } = req.body;
    const userId = (req as any).user?.user_id || 'admin';
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await VariantIngestionService.rejectVariant(id, reason || '', userId);
    return ResponseUtil.success(res, result, 'Variant rejected');
  });

  // GET /admin/imports/:id/diff
  static getDiff = catchAsync(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const diffs = await VariantPushService.getDiff(id);
    return ResponseUtil.success(res, diffs, 'Diff retrieved');
  });

  // POST /admin/imports/check-duplicates
  static checkDuplicates = catchAsync(async (req: Request, res: Response) => {
    const { variants } = req.body;
    if (!Array.isArray(variants) || variants.length === 0) {
      return ResponseUtil.badRequest(res, 'variants array is required');
    }
    const result = await VariantIngestionService.checkDuplicates(variants);
    return ResponseUtil.success(res, result, 'Duplicate check complete');
  });
}
