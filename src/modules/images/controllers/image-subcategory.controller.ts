import { Response } from 'express';
import { AppError } from '../../../shared/utils/app-error.util';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { ImageSubCategoryService } from '../services/image-subcategory.service';

export class ImageSubCategoryController {
  static getAllImageSubCategories = catchAsync(async (req: any, res: Response) => {
    const result = await ImageSubCategoryService.getAllImageSubCategories(req.query);
    return ResponseUtil.paginated(res, result.subcategories, result.pagination, 'Image subcategories retrieved successfully');
  });

  static getImageSubCategoryById = catchAsync(async (req: any, res: Response) => {
    const subcategory = await ImageSubCategoryService.getImageSubCategoryById(req.params.id);
    if (!subcategory) {
      throw new AppError('Image subcategory not found', 404);
    }
    return ResponseUtil.success(res, subcategory, 'Image subcategory retrieved successfully');
  });

  static getImageSubCategoryBySlug = catchAsync(async (req: any, res: Response) => {
    const subcategory = await ImageSubCategoryService.getImageSubCategoryBySlug(req.params.slug);
    if (!subcategory) {
      throw new AppError('Image subcategory not found', 404);
    }
    return ResponseUtil.success(res, subcategory, 'Image subcategory retrieved successfully');
  });

  static createImageSubCategory = catchAsync(async (req: any, res: Response) => {
    const subcategory = await ImageSubCategoryService.createImageSubCategory(req.body);
    return ResponseUtil.created(res, subcategory, 'Image subcategory created successfully');
  });

  static updateImageSubCategory = catchAsync(async (req: any, res: Response) => {
    const subcategory = await ImageSubCategoryService.updateImageSubCategory(req.params.id, req.body);
    return ResponseUtil.success(res, subcategory, 'Image subcategory updated successfully');
  });

  static deleteImageSubCategory = catchAsync(async (req: any, res: Response) => {
    await ImageSubCategoryService.deleteImageSubCategory(req.params.id);
    return ResponseUtil.success(res, null, 'Image subcategory deleted successfully');
  });

  static restoreImageSubCategory = catchAsync(async (req: any, res: Response) => {
    const subcategory = await ImageSubCategoryService.restoreImageSubCategory(req.params.id);
    return ResponseUtil.success(res, subcategory, 'Image subcategory restored successfully');
  });

  static toggleImageSubCategoryActive = catchAsync(async (req: any, res: Response) => {
    const { is_active } = req.body;
    const subcategory = await ImageSubCategoryService.toggleImageSubCategoryActive(req.params.id, is_active);
    return ResponseUtil.success(res, subcategory, 'Image subcategory status updated successfully');
  });

  static reorderImageSubCategories = catchAsync(async (req: any, res: Response) => {
    const { orders } = req.body;
    await ImageSubCategoryService.reorderImageSubCategories(orders);
    return ResponseUtil.success(res, null, 'Image subcategories reordered successfully');
  });
}
