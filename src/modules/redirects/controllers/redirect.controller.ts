import { createRedirectSchema, updateRedirectSchema } from '../../../shared/validation';
import { Response } from 'express';
import { AuthRequest } from '../../../types/auth';
import { AppError } from '../../../shared/utils/app-error.util';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { RedirectService } from '../services/redirect.service';

function actorFrom(req: AuthRequest) {
  if (!req.user) return null;
  return { user_id: req.user.user_id, email: req.user.email, role: req.user.role };
}

export class RedirectController {
  static list = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await RedirectService.list({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      q: req.query.q as string | undefined,
      is_deleted: req.query.is_deleted as string | undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
    });
    return ResponseUtil.paginated(res, result.redirects, result.pagination, 'Redirects retrieved successfully');
  });

  static getById = catchAsync(async (req: AuthRequest, res: Response) => {
    const redirect = await RedirectService.getById(req.params.id as string);
    if (!redirect) throw AppError.notFound('Redirect', 'redirect_id', String(req.params.id ?? ''));
    return ResponseUtil.success(res, redirect, 'Redirect retrieved successfully');
  });

  static create = catchAsync(async (req: AuthRequest, res: Response) => {
    const dto: any = {
      old_url: req.body.old_url,
      new_url: req.body.new_url,
      type: req.body.type,
      reason: req.body.reason,
    };
    const validation = createRedirectSchema.safeParse(dto);
    if (!validation.success) throw new AppError(validation.error.issues.map((e: any) => e.message).join(', '), 400);

    const created = await RedirectService.create(dto, actorFrom(req));
    return ResponseUtil.created(res, created, 'Redirect created successfully');
  });

  static update = catchAsync(async (req: AuthRequest, res: Response) => {
    const dto: any = {
      old_url: req.body.old_url,
      new_url: req.body.new_url,
      type: req.body.type,
      reason: req.body.reason,
    };
    const validation = updateRedirectSchema.safeParse(dto);
    if (!validation.success) throw new AppError(validation.error.issues.map((e: any) => e.message).join(', '), 400);

    const updated = await RedirectService.update(req.params.id as string, dto, actorFrom(req));
    return ResponseUtil.success(res, updated, 'Redirect updated successfully');
  });

  static remove = catchAsync(async (req: AuthRequest, res: Response) => {
    const updated = await RedirectService.softDelete(req.params.id as string, actorFrom(req));
    return ResponseUtil.success(res, updated, 'Redirect deleted successfully');
  });

  static restore = catchAsync(async (req: AuthRequest, res: Response) => {
    const updated = await RedirectService.restore(req.params.id as string, actorFrom(req));
    return ResponseUtil.success(res, updated, 'Redirect restored successfully');
  });

  /** Public: resolve a path through the redirect table. Used by the frontend. */
  static resolvePublic = catchAsync(async (req: AuthRequest, res: Response) => {
    const url = (req.query.url as string) || '';
    if (!url) throw new AppError('url query param is required', 400);
    const result = await RedirectService.resolve(url);
    if (!result) return ResponseUtil.success(res, { resolved: false }, 'No redirect');
    RedirectService.recordHit(result.redirect_id);
    return ResponseUtil.success(res, { resolved: true, ...result }, 'Redirect resolved');
  });
}
