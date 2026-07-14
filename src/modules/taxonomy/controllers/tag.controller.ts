import { Request, Response } from 'express';
import { AppError } from '../../../shared/utils/app-error.util';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { TagService } from '../services/tag.service';
import { CreateTagDto, UpdateTagDto } from '../../../shared/validation';

export class TagController {
  static getAllPublic = catchAsync(async (req: Request, res: Response) => {
    const filterDto = { ...req.query, is_published: true };
    const result = await TagService.getAll(filterDto, false);
    return ResponseUtil.paginated(res, result.tags, result.pagination, 'Tags retrieved successfully');
  });

  static getPublicBySlug = catchAsync(async (req: Request, res: Response) => {
    const tag = await TagService.getBySlug(req.params.slug as string);
    if (!tag) {
      throw new AppError(`Tag not found for slug: ${req.params.slug}`, 404);
    }
    return ResponseUtil.success(res, tag, 'Tag retrieved successfully');
  });

  static getAllAdmin = catchAsync(async (req: Request, res: Response) => {
    const includeDeleted = req.query.include_deleted === 'true';
    const result = await TagService.getAll(req.query, includeDeleted);
    return ResponseUtil.paginated(res, result.tags, result.pagination, 'Tags retrieved successfully');
  });

  static getAdminById = catchAsync(async (req: Request, res: Response) => {
    const tag = await TagService.getById(req.params.id as string);
    if (!tag) {
      throw new AppError(`Tag not found: ${req.params.id}`, 404);
    }
    return ResponseUtil.success(res, tag, 'Tag retrieved successfully');
  });

  static create = catchAsync(async (req: Request, res: Response) => {
    const dto: CreateTagDto = {
      tag_category_id: req.body.tag_category_id,
      name: req.body.name,
      description: req.body.description,
      seo_meta: req.body.seo_meta,
      is_published: req.body.is_published,
      sort_order: req.body.sort_order,
    };

    const validation = CreateTagDto.validate(dto);
    if (!validation.success) {
      throw new AppError(validation.error.issues.map((e: any) => e.message).join(', '), 400);
    }

    const created = await TagService.create(dto);
    return ResponseUtil.created(res, created, 'Tag created successfully');
  });

  static update = catchAsync(async (req: Request, res: Response) => {
    const dto: UpdateTagDto = {
      tag_category_id: req.body.tag_category_id,
      name: req.body.name,
      description: req.body.description,
      seo_meta: req.body.seo_meta,
      is_published: req.body.is_published,
      sort_order: req.body.sort_order,
    };

    const validation = UpdateTagDto.validate(dto);
    if (!validation.success) {
      throw new AppError(validation.error.issues.map((e: any) => e.message).join(', '), 400);
    }

    const updated = await TagService.update(req.params.id as string, dto);
    return ResponseUtil.success(res, updated, 'Tag updated successfully');
  });

  static remove = catchAsync(async (req: Request, res: Response) => {
    const removed = await TagService.softDelete(req.params.id as string);
    return ResponseUtil.success(res, removed, 'Tag deleted successfully');
  });

  static restore = catchAsync(async (req: Request, res: Response) => {
    const restored = await TagService.restore(req.params.id as string);
    return ResponseUtil.success(res, restored, 'Tag restored successfully');
  });
}
