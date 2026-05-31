import { Response } from 'express';
import { AuditEntityType } from '../../../models/audit-log.model';
import { AuthRequest } from '../../../types/auth';
import { AppError } from '../../../shared/utils/app-error.util';
import { AuditUtil } from '../../../shared/utils/audit.util';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { AuditService } from '../services/audit.service';
import { AuditOperationsService } from '../services/audit-operations.service';

const ENTITY_TYPES: AuditEntityType[] = ['car', 'variant', 'tag', 'tag_category', 'benchmark_override'];

function parseEntityType(input: unknown): AuditEntityType | undefined {
  if (input == null || input === '') return undefined;
  if (typeof input !== 'string') return undefined;
  return (ENTITY_TYPES as string[]).includes(input) ? (input as AuditEntityType) : undefined;
}

export class AuditController {
  static list = catchAsync(async (req: AuthRequest, res: Response) => {
    const { entity_type, entity_id, actor_user_id, action, since, page, limit, hydrate_users } = req.query;

    const result = await AuditService.list({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      entity_type: parseEntityType(entity_type),
      entity_id: entity_id ? String(entity_id) : undefined,
      actor_user_id: actor_user_id ? String(actor_user_id) : undefined,
      action: action ? String(action) : undefined,
      since: since ? String(since) : undefined,
    });

    let users: Record<string, { user_name: string; email: string }> = {};
    if (hydrate_users === 'true' || hydrate_users === '1') {
      const userIds = result.logs.map(l => l.actor_user_id).filter((id): id is string => !!id);
      users = await AuditService.hydrateUserNames(userIds);
    }

    return ResponseUtil.paginated(
      res,
      result.logs.map(l => ({
        ...l,
        actor_name: l.actor_user_id ? users[l.actor_user_id]?.user_name ?? null : null,
      })),
      result.pagination,
      'Audit logs retrieved successfully'
    );
  });

  static recent = catchAsync(async (req: AuthRequest, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const result = await AuditService.list({ page: 1, limit });
    const userIds = result.logs.map(l => l.actor_user_id).filter((id): id is string => !!id);
    const users = await AuditService.hydrateUserNames(userIds);
    return ResponseUtil.paginated(
      res,
      result.logs.map(l => ({
        ...l,
        actor_name: l.actor_user_id ? users[l.actor_user_id]?.user_name ?? null : null,
      })),
      result.pagination,
      'Recent audit activity'
    );
  });

  static stale = catchAsync(async (req: AuthRequest, res: Response) => {
    const days = Number(req.query.days ?? 60);
    const limit = Number(req.query.limit ?? 25);
    const result = await AuditService.getStaleContent(Number.isFinite(days) && days > 0 ? days : 60, limit);
    return ResponseUtil.success(res, result, 'Stale content retrieved');
  });

  static markReviewed = catchAsync(async (req: AuthRequest, res: Response) => {
    const entityType = req.params.entity_type as 'car' | 'variant';
    if (entityType !== 'car' && entityType !== 'variant') {
      throw new AppError(`entity_type must be 'car' or 'variant' (got: ${entityType})`, 400);
    }
    const updated = await AuditService.markReviewed(
      entityType,
      req.params.entity_id as string,
      AuditUtil.actorFromRequest(req)
    );
    return ResponseUtil.success(res, updated, 'Marked as reviewed');
  });

  // ── Operations Center ───────────────────────────────────────────────────────

  // GET /audit/admin/activity — grouped activity timeline (Tabs 1 & 2)
  static activity = catchAsync(async (req: AuthRequest, res: Response) => {
    const { entity_type, entity_id, action, actor_user_id, from, to, page, limit } = req.query;
    const result = await AuditOperationsService.getActivity({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      entity_type: entity_type ? String(entity_type) : undefined,
      entity_id: entity_id ? String(entity_id) : undefined,
      action: action ? String(action) : undefined,
      actor_user_id: actor_user_id ? String(actor_user_id) : undefined,
      from: from ? String(from) : undefined,
      to: to ? String(to) : undefined,
    });
    return ResponseUtil.paginated(res, result.events, result.pagination, 'Activity timeline retrieved');
  });

  // GET /audit/admin/imports — import monitoring (Tab 3)
  static imports = catchAsync(async (req: AuthRequest, res: Response) => {
    const { status, import_type, source, page, limit } = req.query;
    const result = await AuditOperationsService.getImports({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status ? String(status) : undefined,
      import_type: import_type ? String(import_type) : undefined,
      source: source ? String(source) : undefined,
    });
    return ResponseUtil.success(res, result, 'Import monitoring data retrieved');
  });

  // GET /audit/admin/imports/:import_id — import detail drawer (Tab 3)
  static importDetail = catchAsync(async (req: AuthRequest, res: Response) => {
    const detail = await AuditOperationsService.getImportDetail(String(req.params.import_id));
    if (!detail) return ResponseUtil.notFound(res, 'Import log not found');
    return ResponseUtil.success(res, detail, 'Import detail retrieved');
  });

  // GET /audit/admin/alerts — system alerts, generated on demand (Tab 4)
  static alerts = catchAsync(async (_req: AuthRequest, res: Response) => {
    const result = await AuditOperationsService.getAlerts();
    return ResponseUtil.success(res, result, 'System alerts generated');
  });

  // GET /audit/admin/entity/search?q= — entity history search (Tab 6)
  static entitySearch = catchAsync(async (req: AuthRequest, res: Response) => {
    const q = String(req.query.q ?? '').trim();
    if (q.length < 2) return ResponseUtil.success(res, [], 'Query too short');
    const results = await AuditOperationsService.searchEntities(q);
    return ResponseUtil.success(res, results, 'Entity search results retrieved');
  });

  // GET /audit/admin/entity/:entity_type/:entity_id/history — full entity timeline (Tab 6)
  static entityHistory = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await AuditOperationsService.getEntityHistory(
      String(req.params.entity_type),
      String(req.params.entity_id),
    );
    return ResponseUtil.success(res, result, 'Entity history retrieved');
  });
}
