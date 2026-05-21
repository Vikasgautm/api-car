import { Response } from 'express';
import { AppError } from '../../../shared/utils/app-error.util';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { AuthRequest } from '../../../types/auth';
import { catchAsync } from '../../../utils/catchAsync';
import { CarImageService } from '../services/car-image.service';
import { ImageStatus, MainCategory, SubCategory } from '../../../shared/services/media/media-constants';

// ─── FormData parsing helpers ────────────────────────────────────────────────

const JSON_FIELDS = [
  'tags', 'metadata', 'car_id', 'variant_id',
  'category_id', 'sub_category_id',
  'display_order', 'sort_order', 'is_primary', 'is_published',
];

const parseJSONField = (value: any): any => {
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
};

const parseFormDataBody = (body: Record<string, any>): Record<string, any> => {
  const parsed: Record<string, any> = {};
  for (const [key, value] of Object.entries(body)) {
    parsed[key] = JSON_FIELDS.includes(key) ? parseJSONField(value) : value;
  }
  return parsed;
};

// ─── Controller ──────────────────────────────────────────────────────────────

export class CarImageController {

  // ─── Public ────────────────────────────────────────────────────────────────

  static getPublicGallery = catchAsync(async (req: any, res: Response) => {
    const result = await CarImageService.getPublicGallery(req.query);
    return ResponseUtil.paginated(res, result.images, result.pagination, 'Gallery retrieved successfully');
  });

  static getCarGallery = catchAsync(async (req: any, res: Response) => {
    const result = await CarImageService.getCarGallery(req.params.carId);
    return ResponseUtil.success(res, result, 'Car gallery retrieved successfully');
  });

  static getImagesByCategory = catchAsync(async (req: any, res: Response) => {
    const { carId, category } = req.params;
    const { sub_category } = req.query;
    const images = await CarImageService.getImagesByCategory(
      carId,
      category as MainCategory,
      sub_category as SubCategory | undefined,
    );
    return ResponseUtil.success(res, images, 'Category images retrieved successfully');
  });

  static getPrimaryWithFallback = catchAsync(async (req: any, res: Response) => {
    const result = await CarImageService.getPrimaryWithFallback(req.params.carId);
    return ResponseUtil.success(res, result, 'Primary image resolved');
  });

  // ─── Admin — list / single ─────────────────────────────────────────────────

  static getAllAdminCarImages = catchAsync(async (req: any, res: Response) => {
    const includeDeleted = req.query.include_deleted === 'true';
    const result = await CarImageService.getAllCarImages(req.query, includeDeleted);
    return ResponseUtil.paginated(res, result.images, result.pagination, 'Car images retrieved successfully');
  });

  static getAdminCarImageById = catchAsync(async (req: any, res: Response) => {
    const image = await CarImageService.getCarImageById(req.params.id);
    if (!image) throw new AppError('Car image not found', 404);
    return ResponseUtil.success(res, image, 'Car image retrieved successfully');
  });

  // ─── Admin — create / update / delete ─────────────────────────────────────

  static createCarImage = catchAsync(async (req: AuthRequest & any, res: Response) => {
    const uploadedBy = req.user?.user_id || req.user?.id;
    const parsedBody = parseFormDataBody(req.body);

    const imageData = {
      ...parsedBody,
      url: (req.file as any)?.secure_url || req.file?.path || parsedBody.url,
    };

    const image = await CarImageService.createCarImage(imageData, uploadedBy);
    return ResponseUtil.created(res, image, 'Car image created successfully');
  });

  static updateCarImage = catchAsync(async (req: any, res: Response) => {
    const parsedBody = parseFormDataBody(req.body);

    const imageData = {
      ...parsedBody,
      url: (req.file as any)?.secure_url || req.file?.path || parsedBody.url,
    };

    const image = await CarImageService.updateCarImage(req.params.id, imageData);
    return ResponseUtil.success(res, image, 'Car image updated successfully');
  });

  static deleteCarImage = catchAsync(async (req: any, res: Response) => {
    const image = await CarImageService.deleteCarImage(req.params.id);
    return ResponseUtil.success(res, image, 'Car image deleted successfully');
  });

  static restoreCarImage = catchAsync(async (req: any, res: Response) => {
    const image = await CarImageService.restoreCarImage(req.params.id);
    return ResponseUtil.success(res, image, 'Car image restored successfully');
  });

  // ─── Admin — status / primary toggles ─────────────────────────────────────

  static togglePublish = catchAsync(async (req: any, res: Response) => {
    const image = await CarImageService.togglePublish(req.params.id);
    return ResponseUtil.success(res, image, 'Publish status toggled');
  });

  static setPrimaryImage = catchAsync(async (req: any, res: Response) => {
    const image = await CarImageService.setPrimaryImage(req.params.id);
    return ResponseUtil.success(res, image, 'Primary image set successfully');
  });

  // ─── Admin — bulk operations ───────────────────────────────────────────────

  static bulkUpdateStatus = catchAsync(async (req: any, res: Response) => {
    const { image_ids, status } = req.body;
    if (!Array.isArray(image_ids) || !image_ids.length) {
      throw new AppError('image_ids array is required', 400);
    }
    if (!status) throw new AppError('status is required', 400);

    const result = await CarImageService.bulkUpdateStatus(image_ids, status as ImageStatus);
    return ResponseUtil.success(res, result, `Status updated to "${status}" for ${result.modifiedCount} images`);
  });

  static bulkAssignCategory = catchAsync(async (req: any, res: Response) => {
    const { image_ids, main_category, sub_category } = req.body;
    if (!Array.isArray(image_ids) || !image_ids.length) {
      throw new AppError('image_ids array is required', 400);
    }
    if (!main_category) throw new AppError('main_category is required', 400);

    const result = await CarImageService.bulkAssignCategory(
      image_ids,
      main_category as MainCategory,
      sub_category as SubCategory | undefined,
    );
    return ResponseUtil.success(res, result, `Category assigned to ${result.modifiedCount} images`);
  });

  static bulkDelete = catchAsync(async (req: any, res: Response) => {
    const { image_ids } = req.body;
    if (!Array.isArray(image_ids) || !image_ids.length) {
      throw new AppError('image_ids array is required', 400);
    }
    const result = await CarImageService.bulkDelete(image_ids);
    return ResponseUtil.success(res, result, `${result.modifiedCount} images deleted`);
  });
}
