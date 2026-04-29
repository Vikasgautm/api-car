import { Response } from 'express';
import { AppError } from '../../../shared/utils/app-error.util';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { ImageCategoryService } from '../services/image-category.service';

export class ImageCategoryController {
  static getAllImageCategories = catchAsync(async (req: any, res: Response) => {
    const result = await ImageCategoryService.getAllImageCategories(req.query);
    return ResponseUtil.paginated(res, result.categories, result.pagination, 'Image categories retrieved successfully');
  });

  static getImageCategoryById = catchAsync(async (req: any, res: Response) => {
    const category = await ImageCategoryService.getImageCategoryById(req.params.id);
    if (!category) {
      throw new AppError('Image category not found', 404);
    }
    return ResponseUtil.success(res, category, 'Image category retrieved successfully');
  });

  static getImageCategoryBySlug = catchAsync(async (req: any, res: Response) => {
    const category = await ImageCategoryService.getImageCategoryBySlug(req.params.slug);
    if (!category) {
      throw new AppError('Image category not found', 404);
    }
    return ResponseUtil.success(res, category, 'Image category retrieved successfully');
  });

  static createImageCategory = catchAsync(async (req: any, res: Response) => {
    const category = await ImageCategoryService.createImageCategory(req.body);
    return ResponseUtil.created(res, category, 'Image category created successfully');
  });

  static updateImageCategory = catchAsync(async (req: any, res: Response) => {
    const category = await ImageCategoryService.updateImageCategory(req.params.id, req.body);
    return ResponseUtil.success(res, category, 'Image category updated successfully');
  });

  static deleteImageCategory = catchAsync(async (req: any, res: Response) => {
    await ImageCategoryService.deleteImageCategory(req.params.id);
    return ResponseUtil.success(res, null, 'Image category deleted successfully');
  });

  static restoreImageCategory = catchAsync(async (req: any, res: Response) => {
    const category = await ImageCategoryService.restoreImageCategory(req.params.id);
    return ResponseUtil.success(res, category, 'Image category restored successfully');
  });

  static toggleImageCategoryActive = catchAsync(async (req: any, res: Response) => {
    const { is_active } = req.body;
    const category = await ImageCategoryService.toggleImageCategoryActive(req.params.id, is_active);
    return ResponseUtil.success(res, category, 'Image category status updated successfully');
  });

  static reorderImageCategories = catchAsync(async (req: any, res: Response) => {
    const { orders } = req.body;
    await ImageCategoryService.reorderImageCategories(orders);
    return ResponseUtil.success(res, null, 'Image categories reordered successfully');
  });
}
