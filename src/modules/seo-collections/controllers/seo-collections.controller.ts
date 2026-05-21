import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { SeoCollectionService } from '../services/seo-collection.service';

export class SeoCollectionsController {
  static list = catchAsync(async (req: Request, res: Response) => {
    const result = await SeoCollectionService.list(req.query as any);
    return ResponseUtil.paginated(res, result.collections, result.pagination, 'SEO collections retrieved');
  });

  static getById = catchAsync(async (req: Request, res: Response) => {
    const collection = await SeoCollectionService.getById(req.params.id as string);
    return ResponseUtil.success(res, collection);
  });

  static getPublicBySlug = catchAsync(async (req: Request, res: Response) => {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const result = await SeoCollectionService.hydrate(req.params.slug as string, page);
    return ResponseUtil.success(res, result);
  });

  static create = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.user_id;
    const collection = await SeoCollectionService.create(req.body, userId);
    return ResponseUtil.created(res, collection, 'SEO collection created');
  });

  static update = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.user_id;
    const collection = await SeoCollectionService.update(req.params.id as string, req.body, userId);
    return ResponseUtil.success(res, collection, 'SEO collection updated');
  });

  static remove = catchAsync(async (req: Request, res: Response) => {
    const collection = await SeoCollectionService.softDelete(req.params.id as string);
    return ResponseUtil.success(res, collection, 'SEO collection deleted');
  });

  static refresh = catchAsync(async (req: Request, res: Response) => {
    const collection = await SeoCollectionService.refresh(req.params.id as string);
    return ResponseUtil.success(res, collection, 'SEO collection refreshed');
  });

  static generateContent = catchAsync(async (req: Request, res: Response) => {
    const collection = await SeoCollectionService.generateContent(req.params.id as string);
    return ResponseUtil.success(res, collection, 'Content generated');
  });

  static previewQuery = catchAsync(async (req: Request, res: Response) => {
    const result = await SeoCollectionService.previewQuery(req.body);
    return ResponseUtil.success(res, result, 'Preview results');
  });

  static health = catchAsync(async (req: Request, res: Response) => {
    const result = await SeoCollectionService.getHealth(req.query as any);
    return ResponseUtil.paginated(res, result.collections, result.pagination, 'Health report');
  });

  static healthSummary = catchAsync(async (req: Request, res: Response) => {
    const summary = await SeoCollectionService.getHealthSummary();
    return ResponseUtil.success(res, summary, 'Health summary');
  });
}
