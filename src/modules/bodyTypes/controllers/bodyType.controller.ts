import { Request, Response } from "express";
import { AppError } from "../../../shared/utils/app-error.util";
import { ResponseUtil } from "../../../shared/utils/response.util";
import { catchAsync } from "../../../utils/catchAsync";
import { CreateBodyTypeDto } from "../dto/create-body-type.dto";
import { UpdateBodyTypeDto } from "../dto/update-body-type.dto";
import { BodyTypeService } from "../services/bodyType.service";

export class BodyTypeController {
  // Public routes
  static getAllPublicBodyTypes = catchAsync(async (req: Request, res: Response) => {
    const filterDto = {
      ...req.query,
      is_published: true,
    };
    const result = await BodyTypeService.getAllBodyTypes(filterDto, false);
    return ResponseUtil.paginated(res, result.bodyTypes, result.pagination, 'Body types retrieved successfully');
  });

  static getPublicBodyTypeBySlug = catchAsync(async (req: Request, res: Response) => {
    const bodyType = await BodyTypeService.getBodyTypeBySlug(req.params.slug as string);
    if (!bodyType) {
      throw new AppError("Body type not found", 404);
    }
    return ResponseUtil.success(res, bodyType, "Body type retrieved successfully");
  });

  // Admin routes
  static getAllAdminBodyTypes = catchAsync(async (req: Request, res: Response) => {
    const result = await BodyTypeService.getAllBodyTypes(req.query, true);
    return ResponseUtil.paginated(res, result.bodyTypes, result.pagination, 'Body types retrieved successfully');
  });

  static getAdminBodyTypeById = catchAsync(async (req: Request, res: Response) => {
    const bodyType = await BodyTypeService.getBodyTypeById(req.params.id as string);
    if (!bodyType) {
      throw new AppError("Body type not found", 404);
    }
    return ResponseUtil.success(res, bodyType, "Body type retrieved successfully");
  });

  static createBodyType = catchAsync(async (req: Request, res: Response) => {
    const createDto: CreateBodyTypeDto = {
      name: req.body.name,
      description: req.body.description,
      is_published: req.body.is_published,
      is_featured: req.body.is_featured,
    };

    const validation = CreateBodyTypeDto.validate(createDto);
    if (!validation.valid) {
      throw new AppError(validation.errors.join(', '), 400);
    }

    const bodyType = await BodyTypeService.createBodyType(createDto);
    return ResponseUtil.created(res, bodyType, "Body type created successfully");
  });

  static updateBodyType = catchAsync(async (req: Request, res: Response) => {
    const updateDto: UpdateBodyTypeDto = {
      name: req.body.name,
      description: req.body.description,
      is_published: req.body.is_published !== undefined ? req.body.is_published === 'true' || req.body.is_published === true : undefined,
      is_featured: req.body.is_featured !== undefined ? req.body.is_featured === 'true' || req.body.is_featured === true : undefined,
    };

    const validation = UpdateBodyTypeDto.validate(updateDto);
    if (!validation.valid) {
      throw new AppError(validation.errors.join(', '), 400);
    }

    const bodyType = await BodyTypeService.updateBodyType(req.params.id as string, updateDto);
    return ResponseUtil.success(res, bodyType, "Body type updated successfully");
  });

  static deleteBodyType = catchAsync(async (req: Request, res: Response) => {
    await BodyTypeService.deleteBodyType(req.params.id as string);
    return ResponseUtil.success(res, null, "Body type deleted successfully");
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
