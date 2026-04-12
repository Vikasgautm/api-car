import { Request, Response } from "express";
import { AppError } from "../../../middlewares/error.middleware";
import { catchAsync } from "../../../utils/catchAsync";
import { BrandService } from "../services/brand.service";
interface MulterRequest extends Request {
  files?: {
    [fieldname: string]: Express.Multer.File[];
  };
}
export class BrandController {
  static getAllBrands = catchAsync(async (req: Request, res: Response) => {
    const result = await BrandService.getAllBrands(req.query);
    res.status(200).json({
      status: "success",
      data: result,
    });
  });

  static getBrandBySlug = catchAsync(async (req: Request, res: Response) => {
    const brand = await BrandService.getBrandBySlug(req.params.slug as string);
    if (!brand) {
      throw new AppError("Brand not found", 404);
    }
    res.status(200).json({
      status: "success",
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
    const brand = await BrandService.createBrand({
      ...req.body,
      images,
      // SEO fields
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
    });
    res.status(201).json({
      status: "success",
      data: { brand },
    });
  });

  static updateBrand = catchAsync(async (req: MulterRequest, res: Response) => {
    let updateData = { ...req.body };
    if (updateData.is_published !== undefined) {
      updateData.is_published = updateData.is_published === "true";
    }
    if (req.files?.["images"]) {
      const file = req.files["images"][0];
      updateData.images = {
        url: file.path,
        title: req.body.title || "",
      };
    }
    // SEO fields
    if (req.body.meta_title !== undefined) updateData.meta_title = req.body.meta_title;
    if (req.body.meta_description !== undefined) updateData.meta_description = req.body.meta_description;
    if (req.body.meta_keywords !== undefined) updateData.meta_keywords = req.body.meta_keywords;

    const brand = await BrandService.updateBrand(
      req.params.id as string,
      updateData,
    );
    if (!brand) throw new AppError("Brand not found", 404);
    res.status(200).json({
      status: "success",
      data: { brand },
    });
  });

  static deleteBrand = catchAsync(async (req: Request, res: Response) => {
    const brand = await BrandService.deleteBrand(req.params.id as string);
    if (!brand) throw new AppError("Brand not found", 404);
    res.status(200).json({
      status: "success",
      message: "Brand soft deleted successfully",
    });
  });

  static restoreBrand = catchAsync(async (req: Request, res: Response) => {
    const brand = await BrandService.restoreBrand(req.params.id as string);
    if (!brand) throw new AppError("Brand not found", 404);
    res.status(200).json({
      status: "success",
      message: "Brand restored successfully",
      data: { brand },
    });
  });
}
