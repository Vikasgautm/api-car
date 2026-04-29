import { Request, Response } from "express";
import { AppError } from "../../../shared/utils/app-error.util";
import { ResponseUtil } from "../../../shared/utils/response.util";
import { catchAsync } from "../../../utils/catchAsync";
import { CreateCarDto } from "../dto/create-car.dto";
import { UpdateCarDto } from "../dto/update-car.dto";
import { CarService } from "../services/car.service";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
  files?: {
    [fieldname: string]: Express.Multer.File[];
  } | Express.Multer.File[];
}

export class CarController {
  // Public routes
  static getAllPublicCars = catchAsync(async (req: Request, res: Response) => {
    const filterDto = {
      ...req.query,
      is_published: true,
    };
    const result = await CarService.getAllCars(filterDto, false);
    return ResponseUtil.paginated(res, result.cars, result.pagination, 'Cars retrieved successfully');
  });

  static getPublicCarBySlug = catchAsync(async (req: Request, res: Response) => {
    const result = await CarService.getCarBySlug(req.params.slug as string);
    if (!result) {
      throw new AppError('Car not found', 404);
    }
    return ResponseUtil.success(res, result, "Car retrieved successfully");
  });

  // Admin routes
  static getAllAdminCars = catchAsync(async (req: Request, res: Response) => {
    const result = await CarService.getAllCars(req.query, true);
    return ResponseUtil.paginated(res, result.cars, result.pagination, 'Cars retrieved successfully');
  });

  static getAdminCarById = catchAsync(async (req: Request, res: Response) => {
    const car = await CarService.getCarById(req.params.id as string);
    if (!car) {
      throw new AppError("Car not found", 404);
    }
    return ResponseUtil.success(res, car, "Car retrieved successfully");
  });

  static createCar = catchAsync(async (req: MulterRequest, res: Response) => {
    let thumbnailUrl = req.body.thumbnail_url;
    if (req.file?.path) {
      thumbnailUrl = req.file.path;
    }

    // Handle gallery images
    let gallery: Array<{ url: string; alt?: string }> | undefined;
    if (req.body.gallery) {
      try {
        gallery = typeof req.body.gallery === 'string' 
          ? JSON.parse(req.body.gallery) 
          : req.body.gallery;
      } catch (e) {
        // If parsing fails, use as-is
        gallery = req.body.gallery;
      }
    }

    const createDto: CreateCarDto = {
      name: req.body.name,
      brand_id: req.body.brand_id,
      body_type_id: req.body.body_type_id,
      fuel_type_id: req.body.fuel_type_id,
      description: req.body.description,
      thumbnail_url: thumbnailUrl,
      thumbnail_alt: req.body.thumbnail_alt,
      gallery: gallery,
      gallery_summary: req.body.gallery_summary,
      status: req.body.status,
      is_upcoming: req.body.is_upcoming,
      is_launched: req.body.is_launched,
      expected_exshowroom_price: req.body.expected_exshowroom_price,
      expected_launch_date: req.body.expected_launch_date,
      exshowroom_price: req.body.exshowroom_price,
      launch_date: req.body.launch_date,
      is_electric: req.body.is_electric,
      is_published: req.body.is_published,
      is_featured: req.body.is_featured,
      is_popular: req.body.is_popular,
      is_recommended: req.body.is_recommended,
      is_latest: req.body.is_latest,
      top_selling: req.body.top_selling,
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
      og_image: req.body.og_image,
      canonical_url: req.body.canonical_url,
      noindex: req.body.noindex,
    };

    const validation = CreateCarDto.validate(createDto);
    if (!validation.valid) {
      throw new AppError(validation.errors.join(', '), 400);
    }

    const car = await CarService.createCar(createDto);
    return ResponseUtil.created(res, car, "Car created successfully");
  });

  static updateCar = catchAsync(async (req: MulterRequest, res: Response) => {
    let thumbnailUrl = req.body.thumbnail_url;
    if (req.file?.path) {
      thumbnailUrl = req.file.path;
    }

    // Handle gallery images
    let gallery: Array<{ url: string; alt?: string }> | undefined;
    if (req.body.gallery) {
      try {
        gallery = typeof req.body.gallery === 'string' 
          ? JSON.parse(req.body.gallery) 
          : req.body.gallery;
      } catch (e) {
        // If parsing fails, use as-is
        gallery = req.body.gallery;
      }
    }

    const updateDto: UpdateCarDto = {
      name: req.body.name,
      brand_id: req.body.brand_id,
      body_type_id: req.body.body_type_id,
      fuel_type_id: req.body.fuel_type_id,
      short_description: req.body.short_description,
      description: req.body.description,
      thumbnail_url: thumbnailUrl,
      thumbnail_alt: req.body.thumbnail_alt,
      gallery: gallery,
      gallery_summary: req.body.gallery_summary,
      status: req.body.status,
      is_upcoming: req.body.is_upcoming !== undefined ? req.body.is_upcoming === 'true' || req.body.is_upcoming === true : undefined,
      is_launched: req.body.is_launched !== undefined ? req.body.is_launched === 'true' || req.body.is_launched === true : undefined,
      expected_exshowroom_price: req.body.expected_exshowroom_price,
      expected_launch_date: req.body.expected_launch_date,
      exshowroom_price: req.body.exshowroom_price,
      launch_date: req.body.launch_date,
      is_electric: req.body.is_electric !== undefined ? req.body.is_electric === 'true' || req.body.is_electric === true : undefined,
      is_published: req.body.is_published !== undefined ? req.body.is_published === 'true' || req.body.is_published === true : undefined,
      is_featured: req.body.is_featured !== undefined ? req.body.is_featured === 'true' || req.body.is_featured === true : undefined,
      is_popular: req.body.is_popular !== undefined ? req.body.is_popular === 'true' || req.body.is_popular === true : undefined,
      is_recommended: req.body.is_recommended !== undefined ? req.body.is_recommended === 'true' || req.body.is_recommended === true : undefined,
      is_latest: req.body.is_latest !== undefined ? req.body.is_latest === 'true' || req.body.is_latest === true : undefined,
      top_selling: req.body.top_selling !== undefined ? req.body.top_selling === 'true' || req.body.top_selling === true : undefined,
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
      og_image: req.body.og_image,
      canonical_url: req.body.canonical_url,
      noindex: req.body.noindex,
    };

    const validation = UpdateCarDto.validate(updateDto);
    if (!validation.valid) {
      throw new AppError(validation.errors.join(', '), 400);
    }

    const car = await CarService.updateCar(req.params.id as string, updateDto);
    return ResponseUtil.success(res, car, "Car updated successfully");
  });

  static deleteCar = catchAsync(async (req: Request, res: Response) => {
    await CarService.deleteCar(req.params.id as string);
    return ResponseUtil.success(res, null, "Car deleted successfully");
  });

  static restoreCar = catchAsync(async (req: Request, res: Response) => {
    const car = await CarService.restoreCar(req.params.id as string);
    return ResponseUtil.success(res, car, "Car restored successfully");
  });

  static togglePublish = catchAsync(async (req: Request, res: Response) => {
    const car = await CarService.togglePublish(req.params.id as string);
    return ResponseUtil.success(res, car, "Car publish status toggled successfully");
  });

  static markLaunched = catchAsync(async (req: Request, res: Response) => {
    const car = await CarService.markLaunched(req.params.id as string);
    return ResponseUtil.success(res, car, "Car marked as launched successfully");
  });

  static markUpcoming = catchAsync(async (req: Request, res: Response) => {
    const { expected_exshowroom_price, expected_launch_date } = req.body;
    const car = await CarService.markUpcoming(req.params.id as string, {
      expected_exshowroom_price,
      expected_launch_date,
    });
    return ResponseUtil.success(res, car, "Car marked as upcoming successfully");
  });
}
