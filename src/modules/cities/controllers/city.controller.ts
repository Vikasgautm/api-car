import { Request, Response } from "express";
import { AppError } from "../../../shared/utils/app-error.util";
import { ResponseUtil } from "../../../shared/utils/response.util";
import { catchAsync } from "../../../utils/catchAsync";
import { CreateCityDto } from "../dto/create-city.dto";
import { UpdateCityDto } from "../dto/update-city.dto";
import { CityService } from "../services/city.service";

export class CityController {
  // Public routes
  static getAllPublicCities = catchAsync(async (req: Request, res: Response) => {
    const result = await CityService.getAllCities(req.query);
    return ResponseUtil.paginated(res, result.cities, result.pagination, 'Cities retrieved successfully');
  });

  static getPublicCityBySlug = catchAsync(async (req: Request, res: Response) => {
    const city = await CityService.getCityBySlug(req.params.slug as string);
    if (!city) {
      throw new AppError("City not found", 404);
    }
    return ResponseUtil.success(res, city, "City retrieved successfully");
  });

  // Admin routes
  static getAllAdminCities = catchAsync(async (req: Request, res: Response) => {
    const result = await CityService.getAllCities(req.query);
    return ResponseUtil.paginated(res, result.cities, result.pagination, 'Cities retrieved successfully');
  });

  static getAdminCityById = catchAsync(async (req: Request, res: Response) => {
    const city = await CityService.getCityById(req.params.id as string);
    if (!city) {
      throw new AppError("City not found", 404);
    }
    return ResponseUtil.success(res, city, "City retrieved successfully");
  });

  static createCity = catchAsync(async (req: Request, res: Response) => {
    const createDto: CreateCityDto = {
      name: req.body.name,
      state: req.body.state,
      pincode: req.body.pincode,
      longitude: req.body.longitude,
      latitude: req.body.latitude,
    };

    const validation = CreateCityDto.validate(createDto);
    if (!validation.valid) {
      throw new AppError(validation.errors.join(', '), 400);
    }

    const city = await CityService.createCity(createDto);
    return ResponseUtil.created(res, city, "City created successfully");
  });

  static updateCity = catchAsync(async (req: Request, res: Response) => {
    const updateDto: UpdateCityDto = {
      name: req.body.name,
      slug: req.body.slug,
      state: req.body.state,
      pincode: req.body.pincode,
      longitude: req.body.longitude,
      latitude: req.body.latitude,
    };

    const validation = UpdateCityDto.validate(updateDto);
    if (!validation.valid) {
      throw new AppError(validation.errors.join(', '), 400);
    }

    const city = await CityService.updateCity(req.params.id as string, updateDto);
    return ResponseUtil.success(res, city, "City updated successfully");
  });

  static deleteCity = catchAsync(async (req: Request, res: Response) => {
    await CityService.deleteCity(req.params.id as string);
    return ResponseUtil.success(res, null, "City deleted successfully");
  });

}
