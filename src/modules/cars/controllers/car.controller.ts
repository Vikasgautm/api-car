import { Request, Response } from "express";
import { ERROR_CODES, USER_MESSAGES } from "../../../constants/errorMessages";
import { AuthRequest } from "../../../types/auth";
import { AppError } from "../../../shared/utils/app-error.util";
import { AuditUtil } from "../../../shared/utils/audit.util";
import { ResponseUtil } from "../../../shared/utils/response.util";
import { catchAsync } from "../../../utils/catchAsync";
import { CreateCarDto } from "../dto/create-car.dto";
import { UpdateCarDto } from "../dto/update-car.dto";
import { CarService } from "../services/car.service";
import { RedirectService } from "../../redirects/services/redirect.service";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
  files?: {
    [fieldname: string]: Express.Multer.File[];
  } | Express.Multer.File[];
}

function parseTagIds(input: unknown): string[] | undefined {
  if (input === undefined || input === null || input === '') return undefined;
  if (Array.isArray(input)) {
    return input.map(v => String(v).trim()).filter(Boolean);
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(v => String(v).trim()).filter(Boolean);
      } catch {
        // fall through to csv split
      }
    }
    return trimmed.split(',').map(v => v.trim()).filter(Boolean);
  }
  return undefined;
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
    const slug = req.params.slug as string;

    // Step 1 — consult the standalone Redirect table first. This is the new
    // canonical source of truth; it takes precedence over per-car redirect_to_slug
    // so admins can stage redirects independently of the car entity lifecycle.
    const redirectHit = await RedirectService.resolve(`/cars/${slug}`);
    if (redirectHit) {
      RedirectService.recordHit(redirectHit.redirect_id);
      res.setHeader('Location', redirectHit.new_url);
      return res.status(Number(redirectHit.type) || 301).json({
        success: false,
        statusCode: Number(redirectHit.type) || 301,
        message: 'This URL has been redirected',
        data: { redirect_to: redirectHit.new_url, type: redirectHit.type },
        timestamp: new Date().toISOString(),
      });
    }

    const result = await CarService.getCarBySlug(slug);
    if (!result) {
      throw new AppError(
        `Car not found for slug: ${slug}`,
        404,
        {
          userMessage: USER_MESSAGES.CAR_NOT_FOUND,
          errorCode: ERROR_CODES.CAR_NOT_FOUND,
          details: { field: 'slug', reason: 'The car does not exist or has been deleted.' },
        }
      );
    }

    const car = result.car as any;

    // Step 2 — backward-compat per-car redirect_to_slug. Kept until all callers
    // migrate to the Redirect table; both are written by lifecycle workflows.
    if (car.redirect_to_slug && car.redirect_to_slug !== slug) {
      res.setHeader('Location', `/cars/${car.redirect_to_slug}`);
      return res.status(301).json({
        success: false,
        statusCode: 301,
        message: 'This car has been replaced',
        data: { redirect_to_slug: car.redirect_to_slug },
        timestamp: new Date().toISOString(),
      });
    }

    // Archived / disabled → 410 Gone. Slug is preserved so SEO equity isn't lost,
    // and we still hand the frontend the car body so a graceful "no longer
    // available" page can render with metadata.
    if (car.status === 'archived' || car.status === 'disabled') {
      return res.status(410).json({
        success: false,
        statusCode: 410,
        message: car.status === 'archived' ? 'This car has been archived' : 'This car has been disabled',
        data: { ...result, gone: true, gone_reason: car.status },
        timestamp: new Date().toISOString(),
      });
    }

    // Discontinued → still served (good for SEO) but with a flag the frontend uses
    // to render a "Discontinued model" banner.
    if (car.status === 'discontinued') {
      return ResponseUtil.success(
        res,
        { ...result, discontinued: true },
        'Car retrieved (discontinued)'
      );
    }

    return ResponseUtil.success(res, result, 'Car retrieved successfully');
  });

  // Admin routes
  static getAllAdminCars = catchAsync(async (req: Request, res: Response) => {
    const includeDeleted = req.query.include_deleted === 'true';
    const result = await CarService.getAllCars(req.query, includeDeleted);
    return ResponseUtil.paginated(res, result.cars, result.pagination, 'Cars retrieved successfully');
  });

  static getCarDependencies = catchAsync(async (req: Request, res: Response) => {
    const dependencies = await CarService.getDependencies(req.params.id as string);
    return ResponseUtil.success(res, dependencies, 'Car dependencies retrieved successfully');
  });

  // One-shot maintenance: recompute aggregated variant_count / price range /
  // fuel-type labels for every non-deleted car. Use after deploying the new
  // aggregate fields, or after bulk variant edits, to repopulate cars whose
  // recompute hook never fired.
  static recomputeAggregatesAll = catchAsync(async (_req: Request, res: Response) => {
    const result = await CarService.recomputeAggregatesAll();
    return ResponseUtil.success(res, result, 'Car aggregates recomputed');
  });

  static promoteToCurrent = catchAsync(async (req: AuthRequest, res: Response) => {
    const actor = req.user
      ? { user_id: req.user.user_id, email: req.user.email, role: req.user.role }
      : null;
    const result = await CarService.promoteToCurrent(
      req.params.id as string,
      {
        base_slug: typeof req.body?.base_slug === 'string' ? req.body.base_slug : undefined,
        reason: typeof req.body?.reason === 'string' ? req.body.reason : undefined,
      },
      actor
    );
    return ResponseUtil.success(res, result, 'Car promoted to current generation');
  });

  static getAdminCarById = catchAsync(async (req: Request, res: Response) => {
    const car = await CarService.getCarById(req.params.id as string);
    if (!car) {
      throw new AppError(
        `Car not found for car_id: ${req.params.id}`,
        404,
        {
          userMessage: USER_MESSAGES.CAR_NOT_FOUND,
          errorCode: ERROR_CODES.CAR_NOT_FOUND,
          details: {
            field: 'car_id',
            reason: 'The car does not exist or has been deleted.',
          },
        }
      );
    }
    return ResponseUtil.success(res, car, "Car retrieved successfully");
  });

  static createCar = catchAsync(async (req: MulterRequest, res: Response) => {
    let thumbnailUrl = req.body.thumbnail_url;
    if (req.file) {
      // Handle both local storage (path) and Cloudinary (secure_url)
      const cloudinaryFile = req.file as Express.Multer.File & { secure_url?: string };
      thumbnailUrl = cloudinaryFile.secure_url || req.file.path;
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
      tag_ids: parseTagIds(req.body.tag_ids),
      editor_user_id: req.body.editor_user_id,
      seo_owner_user_id: req.body.seo_owner_user_id,
      reviewer_user_id: req.body.reviewer_user_id,
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

    const car = await CarService.createCar(createDto, AuditUtil.actorFromRequest(req as AuthRequest));
    return ResponseUtil.created(res, car, "Car created successfully");
  });

  static updateCar = catchAsync(async (req: MulterRequest, res: Response) => {
    let thumbnailUrl = req.body.thumbnail_url;
    if (req.file) {
      // Handle both local storage (path) and Cloudinary (secure_url)
      const cloudinaryFile = req.file as Express.Multer.File & { secure_url?: string };
      thumbnailUrl = cloudinaryFile.secure_url || req.file.path;
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
      tag_ids: parseTagIds(req.body.tag_ids),
      editor_user_id: req.body.editor_user_id,
      seo_owner_user_id: req.body.seo_owner_user_id,
      reviewer_user_id: req.body.reviewer_user_id,
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

    const car = await CarService.updateCar(req.params.id as string, updateDto, AuditUtil.actorFromRequest(req as AuthRequest));
    return ResponseUtil.success(res, car, "Car updated successfully");
  });

  static deleteCar = catchAsync(async (req: Request, res: Response) => {
    const car = await CarService.deleteCar(req.params.id as string, AuditUtil.actorFromRequest(req as AuthRequest));
    return ResponseUtil.success(res, car, "Car deleted successfully");
  });

  static restoreCar = catchAsync(async (req: Request, res: Response) => {
    const car = await CarService.restoreCar(req.params.id as string, AuditUtil.actorFromRequest(req as AuthRequest));
    return ResponseUtil.success(res, car, "Car restored successfully");
  });

  static togglePublish = catchAsync(async (req: Request, res: Response) => {
    const car = await CarService.togglePublish(req.params.id as string, AuditUtil.actorFromRequest(req as AuthRequest));
    return ResponseUtil.success(res, car, "Car publish status toggled successfully");
  });

  static markLaunched = catchAsync(async (req: Request, res: Response) => {
    const car = await CarService.markLaunched(req.params.id as string, AuditUtil.actorFromRequest(req as AuthRequest));
    return ResponseUtil.success(res, car, "Car marked as launched successfully");
  });

  static markUpcoming = catchAsync(async (req: Request, res: Response) => {
    const { expected_exshowroom_price, expected_launch_date } = req.body;
    const car = await CarService.markUpcoming(
      req.params.id as string,
      { expected_exshowroom_price, expected_launch_date },
      AuditUtil.actorFromRequest(req as AuthRequest)
    );
    return ResponseUtil.success(res, car, "Car marked as upcoming successfully");
  });
}
