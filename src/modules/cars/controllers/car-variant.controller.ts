import { Request, Response } from 'express';
import { AuthRequest } from '../../../types/auth';
import { CarVariantService } from '../services/car-variant.service';
import { catchAsync } from '../../../utils/catchAsync';
import { AppError } from '../../../middlewares/error.middleware';

export class CarVariantController {
  static getAllVariants = catchAsync<AuthRequest>(async (req, res) => {
    const isAdmin = req.user && ["admin", "superadmin"].includes(req.user.role);
    const fetchAsAdmin = isAdmin || req.query.admin === "true";
    
    const result = await CarVariantService.getAllVariants(req.query, fetchAsAdmin);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  static getVariantBySlug = catchAsync(async (req, res) => {
    const variant = await CarVariantService.getVariantBySlug(req.params.slug as string);
    if (!variant) {
      throw new AppError('Variant not found', 404);
    }
    
    res.status(200).json({
      status: 'success',
      data: { variant },
    });
  });

  static createVariant = catchAsync<AuthRequest>(async (req, res) => {
    const variant = await CarVariantService.createVariant(req.body);
    res.status(201).json({
      status: 'success',
      data: { variant },
    });
  });

  static updateVariant = catchAsync<AuthRequest>(async (req, res) => {
    const variant = await CarVariantService.updateVariant(req.params.id as string, req.body);
    if (!variant) throw new AppError('Variant not found', 404);
    res.status(200).json({
      status: 'success',
      data: { variant },
    });
  });

  static deleteVariant = catchAsync<AuthRequest>(async (req, res) => {
    const variant = await CarVariantService.deleteVariant(req.params.id as string);
    if (!variant) throw new AppError('Variant not found', 404);
    res.status(200).json({
      status: 'success',
      message: 'Variant soft deleted successfully',
    });
  });

  static restoreVariant = catchAsync<AuthRequest>(async (req, res) => {
    const variant = await CarVariantService.restoreVariant(req.params.id as string);
    if (!variant) throw new AppError('Variant not found', 404);
    res.status(200).json({
      status: 'success',
      message: 'Variant restored successfully',
      data: { variant },
    });
  });
}
