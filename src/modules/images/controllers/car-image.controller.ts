import { Response } from 'express';
import { AppError } from '../../../shared/utils/app-error.util';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { AuthRequest } from '../../../types/auth';
import { catchAsync } from '../../../utils/catchAsync';
import { CarImageService } from '../services/car-image.service';

export class CarImageController {
  // Public routes
  static getPublicGallery = catchAsync(async (req: any, res: Response) => {
    const result = await CarImageService.getPublicGallery(req.query);
    return ResponseUtil.paginated(res, result.images, result.pagination, 'Gallery retrieved successfully');
  });

  static getCarGallery = catchAsync(async (req: any, res: Response) => {
    const result = await CarImageService.getCarGallery(req.params.carId);
    return ResponseUtil.success(res, result, 'Car gallery retrieved successfully');
  });

  // Admin routes
  static getAllAdminCarImages = catchAsync(async (req: any, res: Response) => {
    const result = await CarImageService.getAllCarImages(req.query, true);
    return ResponseUtil.paginated(res, result.images, result.pagination, 'Car images retrieved successfully');
  });

  static getAdminCarImageById = catchAsync(async (req: any, res: Response) => {
    const image = await CarImageService.getCarImageById(req.params.id);
    if (!image) {
      throw new AppError('Car image not found', 404);
    }
    return ResponseUtil.success(res, image, 'Car image retrieved successfully');
  });

  static createCarImage = catchAsync(async (req: AuthRequest & any, res: Response) => {
    const uploadedBy = req.user?.user_id || req.user?.id;
    const imageData = {
      ...req.body,
      url: req.file?.path || req.body.url,
      thumbnail_url: req.body.thumbnail_url,
    };

    const image = await CarImageService.createCarImage(imageData, uploadedBy);
    return ResponseUtil.created(res, image, 'Car image created successfully');
  });

  static updateCarImage = catchAsync(async (req: any, res: Response) => {
    const imageData = {
      ...req.body,
      url: req.file?.path || req.body.url,
    };

    const image = await CarImageService.updateCarImage(req.params.id, imageData);
    return ResponseUtil.success(res, image, 'Car image updated successfully');
  });

  static deleteCarImage = catchAsync(async (req: any, res: Response) => {
    await CarImageService.deleteCarImage(req.params.id);
    return ResponseUtil.success(res, null, 'Car image deleted successfully');
  });

  static restoreCarImage = catchAsync(async (req: any, res: Response) => {
    const image = await CarImageService.restoreCarImage(req.params.id);
    return ResponseUtil.success(res, image, 'Car image restored successfully');
  });

  static togglePublish = catchAsync(async (req: any, res: Response) => {
    const image = await CarImageService.togglePublish(req.params.id);
    return ResponseUtil.success(res, image, 'Car image publish status toggled successfully');
  });

  static setPrimaryImage = catchAsync(async (req: any, res: Response) => {
    const image = await CarImageService.setPrimaryImage(req.params.id);
    return ResponseUtil.success(res, image, 'Car image set as primary successfully');
  });
}
