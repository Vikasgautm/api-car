import { Request, Response } from 'express';
import { AuthRequest } from '../../../types/auth';
import { CarService } from '../services/car.service';
import { catchAsync } from '../../../utils/catchAsync';
import { AppError } from '../../../middlewares/error.middleware';
import { generateCarMetadata } from '../../../utils/seo';

interface MulterRequest extends AuthRequest {
  files?: {
    [fieldname: string]: Express.Multer.File[];
  };
}

export class CarController {
  static getAllCars = catchAsync<AuthRequest>(async (req, res) => {
    // If admin is fetching, return all cars, else just published
    const isAdmin = req.user && ["admin", "superadmin"].includes(req.user.role);
    const fetchAsAdmin = isAdmin || req.query.admin === "true";
    
    const result = await CarService.getAllCars(req.query, fetchAsAdmin);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  static getCarBySlug = catchAsync(async (req, res) => {
    const result = await CarService.getCarBySlug(req.params.slug as string);
    if (!result) {
      throw new AppError('Car not found', 404);
    }
    
    const metadata = generateCarMetadata(result.car as any);
    
    res.status(200).json({
      status: 'success',
      data: {
        ...result,
        seo: metadata,
      },
    });
  });

  static createCar = catchAsync<MulterRequest>(async (req, res) => {
    let thumbnail = { preview: "", title: req.body.thumbnailTitle || "" };
    let images: Array<{preview: string, title: string}> = [];

    if (req.files?.["thumbnail"]) {
      thumbnail.preview = req.files["thumbnail"][0].path;
    }

    if (req.files?.["images"]) {
      images = req.files["images"].map(f => ({
        preview: f.path,
        title: req.body.imagesTitle || "Car image"
      }));
    }

    const payload = {
      ...req.body,
      thumbnail,
      images,
      latest: req.body.latest === 'true',
      popular: req.body.popular === 'true',
      recommended: req.body.recommended === 'true',
      electric: req.body.electric === 'true',
      is_published: req.body.is_published === 'true',
      upcoming: req.body.upcoming === 'true',
    };

    const car = await CarService.createCar(payload);
    res.status(201).json({
      status: 'success',
      data: { car },
    });
  });

  static updateCar = catchAsync<MulterRequest>(async (req, res) => {
    const id = req.params.id as string;
    let payload = { ...req.body };
    
    if (req.files?.["thumbnail"]) {
      payload.thumbnail = {
        preview: req.files["thumbnail"][0].path,
        title: req.body.thumbnailTitle || ""
      };
    }
    
    if (req.files?.["images"]) {
      payload.images = req.files["images"].map(f => ({
        preview: f.path,
        title: req.body.imagesTitle || "Car image"
      }));
    }

    // Convert booleans
    const boolFields = ['latest', 'popular', 'recommended', 'electric', 'is_published', 'upcoming'];
    boolFields.forEach(f => {
        if(typeof (payload as any)[f] !== 'undefined') {
            (payload as any)[f] = (payload as any)[f] === 'true' || (payload as any)[f] === true;
        }
    });

    const car = await CarService.updateCar(id, payload);
    if (!car) throw new AppError('Car not found', 404);

    res.status(200).json({
      status: 'success',
      data: { car },
    });
  });

  static deleteCar = catchAsync(async (req, res) => {
    const id = req.params.id as string;
    const deleted = await CarService.deleteCar(id);
    if (!deleted) throw new AppError('Car not found', 404);

    res.status(200).json({
      status: 'success',
      message: 'Car deleted'
    });
  });
}
