import { Request, Response } from "express";
import { ERROR_CODES, USER_MESSAGES } from "../../../constants/errorMessages";
import { AppError } from "../../../shared/utils/app-error.util";
import { ResponseUtil } from "../../../shared/utils/response.util";
import { catchAsync } from "../../../utils/catchAsync";
import { CreateFuelTypeDto } from "../dto/create-fuel-type.dto";
import { UpdateFuelTypeDto } from "../dto/update-fuel-type.dto";
import { FuelTypeService } from "../services/fuel-type.service";

export class FuelTypeController {
  // Public routes
  static getAllPublicFuelTypes = catchAsync(async (req: Request, res: Response) => {
    const filterDto = {
      ...req.query,
      is_published: true,
    };
    const result = await FuelTypeService.getAllFuelTypes(filterDto, false);
    return ResponseUtil.paginated(res, result.fuelTypes, result.pagination, 'Fuel types retrieved successfully');
  });

  static getPublicFuelTypeBySlug = catchAsync(async (req: Request, res: Response) => {
    const fuelType = await FuelTypeService.getFuelTypeBySlug(req.params.slug as string);
    if (!fuelType) {
      throw new AppError(
        `Fuel type not found for slug: ${req.params.slug}`,
        404,
        {
          userMessage: USER_MESSAGES.FUEL_TYPE_NOT_FOUND,
          errorCode: ERROR_CODES.FUEL_TYPE_NOT_FOUND,
          details: {
            field: 'slug',
            reason: 'The fuel type does not exist or has been deleted.',
          },
        }
      );
    }
    return ResponseUtil.success(res, fuelType, "Fuel type retrieved successfully");
  });

  // Admin routes
  static getAllAdminFuelTypes = catchAsync(async (req: Request, res: Response) => {
    const includeDeleted = req.query.include_deleted === 'true';
    const result = await FuelTypeService.getAllFuelTypes(req.query, includeDeleted);
    return ResponseUtil.paginated(res, result.fuelTypes, result.pagination, 'Fuel types retrieved successfully');
  });

  static getAdminFuelTypeById = catchAsync(async (req: Request, res: Response) => {
    const fuelType = await FuelTypeService.getFuelTypeById(req.params.id as string);
    if (!fuelType) {
      throw new AppError(
        `Fuel type not found for fuel_type_id: ${req.params.id}`,
        404,
        {
          userMessage: USER_MESSAGES.FUEL_TYPE_NOT_FOUND,
          errorCode: ERROR_CODES.FUEL_TYPE_NOT_FOUND,
          details: {
            field: 'fuel_type_id',
            reason: 'The fuel type does not exist or has been deleted.',
          },
        }
      );
    }
    return ResponseUtil.success(res, fuelType, "Fuel type retrieved successfully");
  });

  static createFuelType = catchAsync(async (req: Request, res: Response) => {
    const createDto: CreateFuelTypeDto = {
      name: req.body.name,
      description: req.body.description,
      is_published: req.body.is_published,
      is_featured: req.body.is_featured,
    };

    const validation = CreateFuelTypeDto.validate(createDto);
    if (!validation.valid) {
      throw new AppError(validation.errors.join(', '), 400);
    }

    const fuelType = await FuelTypeService.createFuelType(createDto);
    return ResponseUtil.created(res, fuelType, "Fuel type created successfully");
  });

  static updateFuelType = catchAsync(async (req: Request, res: Response) => {
    const updateDto: UpdateFuelTypeDto = {
      name: req.body.name,
      description: req.body.description,
      is_published: req.body.is_published !== undefined ? req.body.is_published === 'true' || req.body.is_published === true : undefined,
      is_featured: req.body.is_featured !== undefined ? req.body.is_featured === 'true' || req.body.is_featured === true : undefined,
    };

    const validation = UpdateFuelTypeDto.validate(updateDto);
    if (!validation.valid) {
      throw new AppError(validation.errors.join(', '), 400);
    }

    const fuelType = await FuelTypeService.updateFuelType(req.params.id as string, updateDto);
    return ResponseUtil.success(res, fuelType, "Fuel type updated successfully");
  });

  static deleteFuelType = catchAsync(async (req: Request, res: Response) => {
    const fuelType = await FuelTypeService.deleteFuelType(req.params.id as string);
    return ResponseUtil.success(res, fuelType, "Fuel type deleted successfully");
  });

  static restoreFuelType = catchAsync(async (req: Request, res: Response) => {
    const fuelType = await FuelTypeService.restoreFuelType(req.params.id as string);
    return ResponseUtil.success(res, fuelType, "Fuel type restored successfully");
  });

  static togglePublish = catchAsync(async (req: Request, res: Response) => {
    const fuelType = await FuelTypeService.togglePublish(req.params.id as string);
    return ResponseUtil.success(res, fuelType, "Fuel type publish status updated successfully");
  });
}
