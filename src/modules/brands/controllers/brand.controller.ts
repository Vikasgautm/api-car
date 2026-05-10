import { Request, Response } from "express";
import { ERROR_CODES, USER_MESSAGES } from "../../../constants/errorMessages";
import { AppError } from "../../../shared/utils/app-error.util";
import { ResponseUtil } from "../../../shared/utils/response.util";
import { catchAsync } from "../../../utils/catchAsync";
import { CreateBrandDto } from "../dto/create-brand.dto";
import { UpdateBrandDto } from "../dto/update-brand.dto";
import { BrandService } from "../services/brand.service";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export class BrandController {
  // Public routes
  static getAllPublicBrands = catchAsync(async (req: Request, res: Response) => {
    const filterDto = {
      ...req.query,
      is_published: true,
    };
    const result = await BrandService.getAllBrands(filterDto, false);
    return ResponseUtil.paginated(res, result.brands, result.pagination, 'Brands retrieved successfully');
  });

  static getPublicBrandBySlug = catchAsync(async (req: Request, res: Response) => {
    const brand = await BrandService.getBrandBySlug(req.params.slug as string);
    if (!brand) {
      throw new AppError(
        `Brand not found for slug: ${req.params.slug}`,
        404,
        {
          userMessage: USER_MESSAGES.BRAND_NOT_FOUND,
          errorCode: ERROR_CODES.BRAND_NOT_FOUND,
          details: {
            field: 'slug',
            reason: 'The brand does not exist or has been deleted.',
          },
        }
      );
    }
    return ResponseUtil.success(res, brand, "Brand retrieved successfully");
  });

  // Admin routes
  static getAllAdminBrands = catchAsync(async (req: Request, res: Response) => {
    const result = await BrandService.getAllBrands(req.query, true);
    return ResponseUtil.paginated(res, result.brands, result.pagination, 'Brands retrieved successfully');
  });

  static getAdminBrandById = catchAsync(async (req: Request, res: Response) => {
    const brand = await BrandService.getBrandById(req.params.id as string);
    if (!brand) {
      throw new AppError(
        `Brand not found for brand_id: ${req.params.id}`,
        404,
        {
          userMessage: USER_MESSAGES.BRAND_NOT_FOUND,
          errorCode: ERROR_CODES.BRAND_NOT_FOUND,
          details: {
            field: 'brand_id',
            reason: 'The brand does not exist or has been deleted.',
          },
        }
      );
    }
    return ResponseUtil.success(res, brand, "Brand retrieved successfully");
  });

  static createBrand = catchAsync(async (req: MulterRequest, res: Response) => {
    const createDto: CreateBrandDto = {
      name: req.body.name,
      description: req.body.description,
      logo_url: req.file
        ? (req.file as Express.Multer.File & { secure_url?: string }).secure_url || req.file.path
        : req.body.logo_url,
      logo_title: req.body.logo_title,
      is_published: req.body.is_published,
      is_featured: req.body.is_featured,
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
      og_image: req.body.og_image,
      canonical_url: req.body.canonical_url,
      noindex: req.body.noindex,
    };

    const validation = CreateBrandDto.validate(createDto);
    if (!validation.valid) {
      throw new AppError(validation.errors.join(', '), 400);
    }

    const brand = await BrandService.createBrand(createDto);
    return ResponseUtil.created(res, brand, "Brand created successfully");
  });

  static updateBrand = catchAsync(async (req: MulterRequest, res: Response) => {
    const updateDto: UpdateBrandDto = {
      name: req.body.name,
      description: req.body.description,
      logo_url: req.file
        ? (req.file as Express.Multer.File & { secure_url?: string }).secure_url || req.file.path
        : req.body.logo_url,
      logo_title: req.body.logo_title,
      is_published: req.body.is_published !== undefined ? req.body.is_published === 'true' || req.body.is_published === true : undefined,
      is_featured: req.body.is_featured !== undefined ? req.body.is_featured === 'true' || req.body.is_featured === true : undefined,
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
      og_image: req.body.og_image,
      canonical_url: req.body.canonical_url,
      noindex: req.body.noindex,
    };

    const validation = UpdateBrandDto.validate(updateDto);
    if (!validation.valid) {
      throw new AppError(
        validation.errors.join(', '),
        400,
        {
          userMessage: USER_MESSAGES.VALIDATION_ERROR,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
          details: {
            fields: validation.errors,
          },
        }
      );
    }

    const brand = await BrandService.updateBrand(req.params.id as string, updateDto);
    return ResponseUtil.success(res, brand, "Brand updated successfully");
  });

  static deleteBrand = catchAsync(async (req: Request, res: Response) => {
    await BrandService.deleteBrand(req.params.id as string);
    return ResponseUtil.success(res, null, "Brand deleted successfully");
  });

  static restoreBrand = catchAsync(async (req: Request, res: Response) => {
    const brand = await BrandService.restoreBrand(req.params.id as string);
    return ResponseUtil.success(res, brand, "Brand restored successfully");
  });

  static togglePublish = catchAsync(async (req: Request, res: Response) => {
    const brand = await BrandService.togglePublish(req.params.id as string);
    return ResponseUtil.success(res, brand, "Brand publish status toggled successfully");
  });
}
