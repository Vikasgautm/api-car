import { createBodyTypeSchema, updateBodyTypeSchema } from '../../../shared/validation';
import { Request, Response } from "express";
import { ERROR_CODES, USER_MESSAGES } from "../../../constants/errorMessages";
import { AppError } from "../../../shared/utils/app-error.util";
import { ResponseUtil } from "../../../shared/utils/response.util";
import { catchAsync } from "../../../utils/catchAsync";
import { BodyTypeService } from "../services/bodyType.service";

export class BodyTypeController {
  // ─── Public ──────────────────────────────────────────────────────────────────

  static getAllPublicBodyTypes = catchAsync(async (req: Request, res: Response) => {
    const filterDto = { ...req.query, is_published: true };
    const result = await BodyTypeService.getAllBodyTypes(filterDto, false);
    return ResponseUtil.paginated(res, result.bodyTypes, result.pagination, 'Body types retrieved successfully');
  });

  static getPublicBodyTypeBySlug = catchAsync(async (req: Request, res: Response) => {
    const bodyType = await BodyTypeService.getBodyTypeBySlug(req.params.slug as string);
    if (!bodyType) {
      throw new AppError(`Body type not found for slug: ${req.params.slug}`, 404, {
        userMessage: USER_MESSAGES.BODY_TYPE_NOT_FOUND,
        errorCode: ERROR_CODES.BODY_TYPE_NOT_FOUND,
        details: { field: 'slug', reason: 'The body type does not exist or has been deleted.' },
      });
    }
    return ResponseUtil.success(res, bodyType, "Body type retrieved successfully");
  });

  // ─── Admin ────────────────────────────────────────────────────────────────────

  static getStats = catchAsync(async (_req: Request, res: Response) => {
    const stats = await BodyTypeService.getStats();
    return ResponseUtil.success(res, stats, "Body type stats retrieved successfully");
  });

  static getArchiveImpact = catchAsync(async (req: Request, res: Response) => {
    const impact = await BodyTypeService.getArchiveImpact(req.params.id as string);
    return ResponseUtil.success(res, impact, "Archive impact retrieved successfully");
  });

  static checkDuplicate = catchAsync(async (req: Request, res: Response) => {
    const { name, exclude_id } = req.query as { name: string; exclude_id?: string };
    if (!name) {
      throw new AppError('name query parameter is required', 400);
    }
    const result = await BodyTypeService.checkDuplicate(name, exclude_id);
    return ResponseUtil.success(res, result, "Duplicate check completed");
  });

  static bulkOperation = catchAsync(async (req: Request, res: Response) => {
    const { ids, action } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('ids must be a non-empty array', 400);
    }
    const validActions = ['publish', 'unpublish', 'archive', 'restore'];
    if (!validActions.includes(action)) {
      throw new AppError(`action must be one of: ${validActions.join(', ')}`, 400);
    }
    const result = await BodyTypeService.bulkOperation(ids, action);
    return ResponseUtil.success(res, result, `Bulk ${action} completed`);
  });

  static reorderBodyTypes = catchAsync(async (req: Request, res: Response) => {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('items must be a non-empty array', 400);
    }
    const result = await BodyTypeService.reorderBodyTypes(items);
    return ResponseUtil.success(res, result, "Body types reordered successfully");
  });

  static getAllAdminBodyTypes = catchAsync(async (req: Request, res: Response) => {
    const includeDeleted = req.query.include_deleted === 'true';
    const result = await BodyTypeService.getAllBodyTypes(req.query, includeDeleted);
    return ResponseUtil.paginated(res, result.bodyTypes, result.pagination, 'Body types retrieved successfully');
  });

  static getAdminBodyTypeById = catchAsync(async (req: Request, res: Response) => {
    const bodyType = await BodyTypeService.getBodyTypeById(req.params.id as string);
    if (!bodyType) {
      throw new AppError(`Body type not found for body_type_id: ${req.params.id}`, 404, {
        userMessage: USER_MESSAGES.BODY_TYPE_NOT_FOUND,
        errorCode: ERROR_CODES.BODY_TYPE_NOT_FOUND,
        details: { field: 'body_type_id', reason: 'The body type does not exist or has been deleted.' },
      });
    }
    return ResponseUtil.success(res, bodyType, "Body type retrieved successfully");
  });

  static createBodyType = catchAsync(async (req: Request, res: Response) => {
    const createDto: any = {
      name: req.body.name,
      description: req.body.description,
      seo_title: req.body.seo_title,
      meta_description: req.body.meta_description,
      intro_content: req.body.intro_content,
      short_description: req.body.short_description,
      is_published: req.body.is_published,
      is_featured: req.body.is_featured,
      logo_url: req.body.logo_url,
      logo_title: req.body.logo_title,
      hero_image_url: req.body.hero_image_url,
      hero_image_alt: req.body.hero_image_alt,
      sort_order: req.body.sort_order,
      parent_id: req.body.parent_id,
      related_body_types: req.body.related_body_types,
      created_by: (req as any).user?.user_id,
    };

    const validation = createBodyTypeSchema.safeParse(createDto);
    if (!validation.success) {
      throw new AppError(validation.error.issues.map((e: any) => e.message).join(', '), 400);
    }

    const bodyType = await BodyTypeService.createBodyType(createDto);
    return ResponseUtil.created(res, bodyType, "Body type created successfully");
  });

  static updateBodyType = catchAsync(async (req: Request, res: Response) => {
    const updateDto: any = {
      name: req.body.name,
      description: req.body.description,
      seo_title: req.body.seo_title,
      meta_description: req.body.meta_description,
      intro_content: req.body.intro_content,
      short_description: req.body.short_description,
      is_published: req.body.is_published !== undefined
        ? req.body.is_published === 'true' || req.body.is_published === true
        : undefined,
      is_featured: req.body.is_featured !== undefined
        ? req.body.is_featured === 'true' || req.body.is_featured === true
        : undefined,
      logo_url: req.body.logo_url,
      logo_title: req.body.logo_title,
      hero_image_url: req.body.hero_image_url,
      hero_image_alt: req.body.hero_image_alt,
      sort_order: req.body.sort_order,
      parent_id: req.body.parent_id,
      related_body_types: req.body.related_body_types,
      updated_by: (req as any).user?.user_id,
    };

    const validation = updateBodyTypeSchema.safeParse(updateDto);
    if (!validation.success) {
      throw new AppError(validation.error.issues.map((e: any) => e.message).join(', '), 400, {
        userMessage: USER_MESSAGES.VALIDATION_ERROR,
        errorCode: ERROR_CODES.VALIDATION_ERROR,
        details: { fields: validation.error.issues.map((e: any) => e.message) },
      });
    }

    const bodyType = await BodyTypeService.updateBodyType(req.params.id as string, updateDto);
    return ResponseUtil.success(res, bodyType, "Body type updated successfully");
  });

  static deleteBodyType = catchAsync(async (req: Request, res: Response) => {
    const bodyType = await BodyTypeService.deleteBodyType(req.params.id as string);
    return ResponseUtil.success(res, bodyType, "Body type deleted successfully");
  });

  static restoreBodyType = catchAsync(async (req: Request, res: Response) => {
    const bodyType = await BodyTypeService.restoreBodyType(req.params.id as string);
    return ResponseUtil.success(res, bodyType, "Body type restored successfully");
  });

  static togglePublish = catchAsync(async (req: Request, res: Response) => {
    const bodyType = await BodyTypeService.togglePublish(req.params.id as string);
    return ResponseUtil.success(res, bodyType, "Body type publish status updated successfully");
  });
}
