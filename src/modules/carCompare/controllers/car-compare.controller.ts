import { Request, Response } from 'express';
import { CarCompareService } from '../services/car-compare.service';
import { catchAsync } from '../../../utils/catchAsync';

export class CarCompareController {
  static getAllComparisons = catchAsync(async (req: Request, res: Response) => {
    const result = await CarCompareService.getAllComparisons(req.query);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  static getComparisonByRoute = catchAsync(async (req: Request, res: Response) => {
    const comparison = await CarCompareService.getComparisonByRoute(req.params.route as string);
    if (!comparison) {
      return res.status(404).json({ status: 'fail', message: 'Comparison not found' });
    }
    res.status(200).json({
      status: 'success',
      data: { comparison },
    });
  });

  static createComparison = catchAsync(async (req: Request, res: Response) => {
    const comparison = await CarCompareService.createComparison(req.body);
    res.status(201).json({
      status: 'success',
      data: { comparison },
    });
  });
}
