import { Response } from 'express';
import { AuditEntityType } from '../../../models/audit-log.model';
import { AuthRequest } from '../../../types/auth';
import { AppError } from '../../../shared/utils/app-error.util';
import { AuditUtil } from '../../../shared/utils/audit.util';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { AuditService } from '../services/audit.service';

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
}
