import { Request, Response } from 'express';
import { AuthRequest } from '../../../types/auth';
import { CityService } from '../services/city.service';
import { catchAsync } from '../../../utils/catchAsync';
import { AppError } from '../../../middlewares/error.middleware';

export class CityController {
  static getAllCities = catchAsync<AuthRequest>(async (req, res) => {
    const result = await CityService.getAllCities(req.query);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  static createCity = catchAsync<AuthRequest>(async (req, res) => {
    const city = await CityService.createCity(req.body);
    res.status(201).json({
      status: 'success',
      data: { city },
    });
  });

  static updateCity = catchAsync<AuthRequest>(async (req, res) => {
    const city = await CityService.updateCity(req.params.id as string, req.body);
    if (!city) throw new AppError('City not found', 404);
    res.status(200).json({
      status: 'success',
      data: { city },
    });
  });

  static deleteCity = catchAsync<AuthRequest>(async (req, res) => {
    const city = await CityService.deleteCity(req.params.id as string);
    if (!city) throw new AppError('City not found', 404);
    res.status(200).json({
      status: 'success',
      message: 'City soft deleted successfully',
    });
  });

  static restoreCity = catchAsync<AuthRequest>(async (req, res) => {
    const city = await CityService.restoreCity(req.params.id as string);
    if (!city) throw new AppError('City not found', 404);
    res.status(200).json({
      status: 'success',
      message: 'City restored successfully',
      data: { city },
    });
  });
}
