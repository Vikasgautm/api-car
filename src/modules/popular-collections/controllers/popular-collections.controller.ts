import { Request, Response } from 'express';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { PopularCollectionService } from '../services/popular-collection.service';
import { CollectionRendererService } from '../services/collection-renderer.service';
import { CollectionStatusService } from '../services/collection-status.service';

const qs = (val: unknown): string => (Array.isArray(val) ? String(val[0]) : String(val ?? ''));
const qn = (val: unknown): number | undefined => {
  const s = Array.isArray(val) ? String(val[0]) : String(val ?? '');
  const n = Number(s);
  return s && !Number.isNaN(n) ? n : undefined;
};

export class PopularCollectionsController {
  // ── PUBLIC: HUB + COLLECTION RENDERING ───────────────────────────────────

  static getHub = catchAsync(async (_req: Request, res: Response) => {
    const hub = await CollectionRendererService.renderHubPreview();
    return ResponseUtil.success(res, hub, 'Popular hub');
  });

  static renderCollection = catchAsync(async (req: Request, res: Response) => {
    const slug = qs(req.params.slug);
    const page = parseInt(qs(req.query.page) || '1', 10);
    const limit = parseInt(qs(req.query.limit) || '24', 10);
    const sort = qs(req.query.sort);

    const filterOverrides: Record<string, any> = {};
    if (req.query.brand_slugs) filterOverrides.brand_slugs = qs(req.query.brand_slugs);
    if (req.query.body_type_slugs) filterOverrides.body_type_slugs = qs(req.query.body_type_slugs);
    if (req.query.fuel_type_slugs) filterOverrides.fuel_type_slugs = qs(req.query.fuel_type_slugs);
    if (req.query.min_price) filterOverrides.min_price = qn(req.query.min_price);
    if (req.query.max_price) filterOverrides.max_price = qn(req.query.max_price);
    if (req.query.transmission) filterOverrides.transmission = qs(req.query.transmission);

    const result = await CollectionRendererService.renderCollection(slug, {
      page,
      limit,
      sort: sort || undefined,
      filter_overrides: Object.keys(filterOverrides).length ? filterOverrides : undefined,
    });
    return ResponseUtil.success(res, result, 'Collection rendered');
  });

  // ── ADMIN: COLLECTION CRUD ────────────────────────────────────────────────

  static list = catchAsync(async (req: Request, res: Response) => {
    const status = req.query.status ? qs(req.query.status) : undefined;
    const collections = await PopularCollectionService.list(status);
    return ResponseUtil.success(res, collections, 'Collections');
  });

  static getById = catchAsync(async (req: Request, res: Response) => {
    const id = qs(req.params.id);
    const coll = await PopularCollectionService.getById(id);
    return ResponseUtil.success(res, coll, 'Collection');
  });

  static create = catchAsync(async (req: Request, res: Response) => {
    const userId: string | undefined = (req as any).user?.user_id;
    const coll = await PopularCollectionService.create(req.body, userId);
    return ResponseUtil.success(res, coll, 'Collection created', 201);
  });

  static update = catchAsync(async (req: Request, res: Response) => {
    const id = qs(req.params.id);
    const userId: string | undefined = (req as any).user?.user_id;
    const coll = await PopularCollectionService.update(id, req.body, userId);
    return ResponseUtil.success(res, coll, 'Collection updated');
  });

  static remove = catchAsync(async (req: Request, res: Response) => {
    const id = qs(req.params.id);
    await PopularCollectionService.remove(id);
    return ResponseUtil.success(res, null, 'Collection deleted');
  });

  // ── ADMIN: EDITORIAL ORDERING ─────────────────────────────────────────────

  static updateOrdering = catchAsync(async (req: Request, res: Response) => {
    const id = qs(req.params.id);
    const userId: string | undefined = (req as any).user?.user_id;
    const coll = await PopularCollectionService.updateCarOrdering(id, req.body, userId);
    return ResponseUtil.success(res, coll, 'Ordering updated');
  });

  static updateRenderingMode = catchAsync(async (req: Request, res: Response) => {
    const id = qs(req.params.id);
    const userId: string | undefined = (req as any).user?.user_id;
    const coll = await PopularCollectionService.updateRenderingMode(id, req.body, userId);
    return ResponseUtil.success(res, coll, 'Rendering mode updated');
  });

  static publish = catchAsync(async (req: Request, res: Response) => {
    const id = qs(req.params.id);
    const userId: string | undefined = (req as any).user?.user_id;
    const coll = await PopularCollectionService.publish(id, userId);
    return ResponseUtil.success(res, coll, 'Collection published');
  });

  static archive = catchAsync(async (req: Request, res: Response) => {
    const id = qs(req.params.id);
    const userId: string | undefined = (req as any).user?.user_id;
    const coll = await PopularCollectionService.archive(id, userId);
    return ResponseUtil.success(res, coll, 'Collection archived');
  });

  static reorderHub = catchAsync(async (req: Request, res: Response) => {
    const { ordered_ids } = req.body;
    const userId: string | undefined = (req as any).user?.user_id;
    if (!Array.isArray(ordered_ids)) {
      return ResponseUtil.error(res, 'ordered_ids array required', 400);
    }
    await PopularCollectionService.reorderHubSections(ordered_ids, userId);
    return ResponseUtil.success(res, null, 'Hub order updated');
  });

  // ── ADMIN: RECOMMENDATIONS + STATUS ──────────────────────────────────────

  static getSystemStatus = catchAsync(async (_req: Request, res: Response) => {
    const status = await CollectionStatusService.getSystemStatus();
    return ResponseUtil.success(res, status, 'System status');
  });

  static getCollectionStatus = catchAsync(async (req: Request, res: Response) => {
    const id = qs(req.params.id);

    const status = await CollectionStatusService.getCollectionStatus(id);
    if (!status) return ResponseUtil.error(res, 'Collection not found', 404);
    return ResponseUtil.success(res, status, 'Collection status');
  });

  static getRecommendations = catchAsync(async (_req: Request, res: Response) => {
    const systemStatus = await CollectionStatusService.getSystemStatus();
    const recommendations = systemStatus.collection_statuses.map((s) => ({
      collection_id: s.collection_id,
      slug: s.slug,
      title: s.title,
      current_mode: s.rendering_mode,
      recommendation: s.recommendation,
      detail: s.recommendation_detail,
      behavioral_confidence: s.behavioral_confidence,
      is_ready: s.is_behavioral_ready,
    }));
    return ResponseUtil.success(
      res,
      { recommendations, engine_status: systemStatus.engine_status },
      'Recommendations'
    );
  });

  // ── ADMIN: PREVIEW QUERY ──────────────────────────────────────────────────

  static previewQuery = catchAsync(async (req: Request, res: Response) => {
    const { discovery_filters } = req.body;
    const resolved = CollectionRendererService.buildDiscoveryFilters(discovery_filters ?? {});
    return ResponseUtil.success(res, { resolved_filters: resolved }, 'Preview filters');
  });
}
