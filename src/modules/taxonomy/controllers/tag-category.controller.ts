import { Request, Response } from 'express';
import { AppError } from '../../../shared/utils/app-error.util';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { TagCategoryService } from '../services/tag-category.service';
import { CreateTagCategoryDto, UpdateTagCategoryDto } from '../../../shared/validation';

export class TagCategoryController {
  static getAllPublic = catchAsync(async (req: Request, res: Response) => {
    const filterDto = { ...req.query, is_published: true };
    const result = await TagCategoryService.getAll(filterDto, false);
    return ResponseUtil.paginated(res, result.categories, result.pagination, 'Tag categories retrieved successfully');
  });

  static getPublicBySlug = catchAsync(async (req: Request, res: Response) => {
    const category = await TagCategoryService.getBySlug(req.params.slug as string);
    if (!category) {
      throw new AppError(`Tag category not found for slug: ${req.params.slug}`, 404);
    }
    return ResponseUtil.success(res, category, 'Tag category retrieved successfully');
  });

  static getAllAdmin = catchAsync(async (req: Request, res: Response) => {
    const includeDeleted = req.query.include_deleted === 'true';
    const result = await TagCategoryService.getAll(req.query, includeDeleted);
    return ResponseUtil.paginated(res, result.categories, result.pagination, 'Tag categories retrieved successfully');
  });

  static getAdminById = catchAsync(async (req: Request, res: Response) => {
    const category = await TagCategoryService.getById(req.params.id as string);
    if (!category) {
      throw new AppError(`Tag category not found: ${req.params.id}`, 404);
    }
    return ResponseUtil.success(res, category, 'Tag category retrieved successfully');
  });

  static create = catchAsync(async (req: Request, res: Response) => {
    const dto: CreateTagCategoryDto = {
      name: req.body.name,
      type: req.body.type ?? 'intent',
      description: req.body.description,
      is_published: req.body.is_published,
      sort_order: req.body.sort_order,
    };

    const validation = CreateTagCategoryDto.validate(dto);
    if (!validation.success) {
      throw new AppError(validation.error.issues.map((e: any) => e.message).join(', '), 400);
    }

    const created = await TagCategoryService.create(dto);
    return ResponseUtil.created(res, created, 'Tag category created successfully');
  });

  static update = catchAsync(async (req: Request, res: Response) => {
    const dto: UpdateTagCategoryDto = {
      name: req.body.name,
      type: req.body.type,
      description: req.body.description,
      is_published: req.body.is_published,
      sort_order: req.body.sort_order,
    };

    const validation = UpdateTagCategoryDto.validate(dto);
    if (!validation.success) {
      throw new AppError(validation.error.issues.map((e: any) => e.message).join(', '), 400);
    }

    const updated = await TagCategoryService.update(req.params.id as string, dto);
    return ResponseUtil.success(res, updated, 'Tag category updated successfully');
  });

  static remove = catchAsync(async (req: Request, res: Response) => {
    const removed = await TagCategoryService.softDelete(req.params.id as string);
    return ResponseUtil.success(res, removed, 'Tag category deleted successfully');
  });

  static restore = catchAsync(async (req: Request, res: Response) => {
    const restored = await TagCategoryService.restore(req.params.id as string);
    return ResponseUtil.success(res, restored, 'Tag category restored successfully');
  });
}
