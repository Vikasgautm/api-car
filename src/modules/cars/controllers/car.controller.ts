import { Request, Response } from 'express';
import { CarService } from '../services/car.service';
import { catchAsync } from '../../../utils/catchAsync';
import { AppError } from '../../../middlewares/error.middleware';
import { generateCarMetadata } from '../../../utils/seo';

export class CarController {
  static getAllCars = catchAsync(async (req: Request, res: Response) => {
    const result = await CarService.getAllCars(req.query);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  static getCarBySlug = catchAsync(async (req: Request, res: Response) => {
    const result = await CarService.getCarBySlug(req.params.slug as string);
    if (!result) {
      throw new AppError('Car not found', 404);
    }
    
    const metadata = generateCarMetadata(result.car);
    
    res.status(200).json({
      status: 'success',
      data: {
        ...result,
        seo: metadata,
      },
    });
  });

  static createCar = catchAsync(async (req: Request, res: Response) => {
    const car = await CarService.createCar(req.body);
    res.status(201).json({
      status: 'success',
      data: { car },
    });
  });
}
