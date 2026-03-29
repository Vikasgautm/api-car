import { Request, Response } from 'express';
import { BrandService } from '../services/brand.service';
import { catchAsync } from '../../../utils/catchAsync';
import { AppError } from '../../../middlewares/error.middleware';
interface MulterRequest extends Request {
  files?: {
    [fieldname: string]: Express.Multer.File[];
  };
}
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

  static createBrand = catchAsync(async (req: MulterRequest, res: Response) => {

    let images = {
      url: "",
      title: req.body.title || "",
      // preview: ""
    };

    if (req.files?.["images"]) {
      const file = req.files["images"][0];
      images.url = file.path;
    }
    const brand = await BrandService.createBrand({ ...req.body, images });
    res.status(201).json({
      status: 'success',
      data: { brand },
    });
  });
}
