import { Request, Response } from 'express';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { FuelTypesIntelligenceService } from '../services/fuel-types-intelligence.service';

export class FuelTypesIntelligenceController {
  static getSummary = catchAsync(async (_req: Request, res: Response) => {
    const data = await FuelTypesIntelligenceService.getSummary();
    return ResponseUtil.success(res, data, 'Fuel type summary retrieved');
  });

  static getBrands = catchAsync(async (_req: Request, res: Response) => {
    const data = await FuelTypesIntelligenceService.getBrands();
    return ResponseUtil.success(res, data, 'Brand fuel distribution retrieved');
  });

  static getBodyTypes = catchAsync(async (_req: Request, res: Response) => {
    const data = await FuelTypesIntelligenceService.getBodyTypes();
    return ResponseUtil.success(res, data, 'Fuel body type distribution retrieved');
  });

  static getBudget = catchAsync(async (_req: Request, res: Response) => {
    const data = await FuelTypesIntelligenceService.getBudget();
    return ResponseUtil.success(res, data, 'Fuel budget distribution retrieved');
  });

  static getBrandBodyBudget = catchAsync(async (_req: Request, res: Response) => {
    const data = await FuelTypesIntelligenceService.getBrandBodyBudget();
    return ResponseUtil.success(res, data, 'Brand fuel body budget matrix retrieved');
  });

  static getSeating = catchAsync(async (_req: Request, res: Response) => {
    const data = await FuelTypesIntelligenceService.getSeating();
    return ResponseUtil.success(res, data, 'Fuel seating distribution retrieved');
  });

  static getLifecycle = catchAsync(async (_req: Request, res: Response) => {
    const data = await FuelTypesIntelligenceService.getLifecycle();
    return ResponseUtil.success(res, data, 'Fuel lifecycle distribution retrieved');
  });

  static getHealth = catchAsync(async (_req: Request, res: Response) => {
    const data = await FuelTypesIntelligenceService.getHealth();
    return ResponseUtil.success(res, data, 'Fuel health issues retrieved');
  });

  static getMultiFuel = catchAsync(async (_req: Request, res: Response) => {
    const data = await FuelTypesIntelligenceService.getMultiFuel();
    return ResponseUtil.success(res, data, 'Multi-fuel models retrieved');
  });
}
