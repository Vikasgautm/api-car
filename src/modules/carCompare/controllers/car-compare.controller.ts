import { Request, Response } from 'express';
import { AuthRequest } from '../../../types/auth';
import { CarCompareService } from '../services/car-compare.service';
import { catchAsync } from '../../../utils/catchAsync';
import { AppError } from '../../../middlewares/error.middleware';

export class CarCompareController {
  static getAllComparisons = catchAsync<AuthRequest>(async (req, res) => {
    const isAdmin = req.user && ["admin", "superadmin"].includes(req.user.role);
    const fetchAsAdmin = isAdmin || req.query.admin === "true";
    
    const result = await CarCompareService.getAllComparisons(req.query, fetchAsAdmin);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  static getComparisonByRoute = catchAsync(async (req, res) => {
    const comparison = await CarCompareService.getComparisonByRoute(req.params.route as string);
    if (!comparison) {
      throw new AppError('Comparison not found', 404);
    }
    res.status(200).json({
      status: 'success',
      data: { comparison },
    });
  });

  static createComparison = catchAsync<AuthRequest>(async (req: any, res) => {
    let images = [];
    if (req.files?.["images"]) {
      images = req.files["images"].map((file: any) => ({
        preview: file.path,
        title: req.body.title || "",
      }));
    }
    const comparison = await CarCompareService.createComparison({ ...req.body, image: images });
    res.status(201).json({
      status: 'success',
      data: { comparison },
    });
  });

  static updateComparison = catchAsync<AuthRequest>(async (req: any, res) => {
    let updateData = { ...req.body };
    if (req.files?.["images"]) {
      const newImages = req.files["images"].map((file: any) => ({
        preview: file.path,
        title: req.body.title || "",
      }));
      updateData.image = newImages;
    }
    const comparison = await CarCompareService.updateComparison(req.params.id as string, updateData);
    if (!comparison) throw new AppError('Comparison not found', 404);
    res.status(200).json({
      status: 'success',
      data: { comparison },
    });
  });

  static deleteComparison = catchAsync<AuthRequest>(async (req, res) => {
    const comparison = await CarCompareService.deleteComparison(req.params.id as string);
    if (!comparison) throw new AppError('Comparison not found', 404);
    res.status(200).json({
      status: 'success',
      message: 'Comparison soft deleted successfully',
    });
  });

  static restoreComparison = catchAsync<AuthRequest>(async (req, res) => {
    const comparison = await CarCompareService.restoreComparison(req.params.id as string);
    if (!comparison) throw new AppError('Comparison not found', 404);
    res.status(200).json({
      status: 'success',
      message: 'Comparison restored successfully',
      data: { comparison },
    });
  });
}
