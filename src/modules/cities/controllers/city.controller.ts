import { Request, Response } from 'express';
import { CityService } from '../services/city.service';
import { catchAsync } from '../../../utils/catchAsync';

export class CityController {
  static getAllCities = catchAsync(async (req: Request, res: Response) => {
    const result = await CityService.getAllCities(req.query);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  static createCity = catchAsync(async (req: Request, res: Response) => {
    const city = await CityService.createCity(req.body);
    res.status(201).json({
      status: 'success',
      data: { city },
    });
  });
}
