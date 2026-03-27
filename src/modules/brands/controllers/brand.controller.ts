import { Request, Response } from 'express';
import { BrandService } from '../services/brand.service';
import { catchAsync } from '../../../utils/catchAsync';
import { AppError } from '../../../middlewares/error.middleware';

export class BrandController {
  static getAllBrands = catchAsync(async (req: Request, res: Response) => {
    const result = await BrandService.getAllBrands(req.query);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  static getBrandBySlug = catchAsync(async (req: Request, res: Response) => {
    const brand = await BrandService.getBrandBySlug(req.params.slug as string);
    if (!brand) {
      throw new AppError('Brand not found', 404);
    }
    res.status(200).json({
      status: 'success',
      data: { brand },
    });
  });

  static createBrand = catchAsync(async (req: Request, res: Response) => {
    const brand = await BrandService.createBrand(req.body);
    res.status(201).json({
      status: 'success',
      data: { brand },
    });
  });
}
