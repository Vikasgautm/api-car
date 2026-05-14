import { Response } from 'express';
import { FuelCategory } from '../../../constants/mileage-benchmarks';
import { AuthRequest } from '../../../types/auth';
import { AppError } from '../../../shared/utils/app-error.util';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { UpsertBenchmarkOverrideDto } from '../dto/upsert-override.dto';
import { IntelligenceService } from '../services/intelligence.service';

function parseFuelCategory(input: unknown): FuelCategory {
  if (input !== 'ice' && input !== 'ev') {
    throw new AppError(`fuel_category must be 'ice' or 'ev' (got: ${String(input)})`, 400);
  }
  return input;
}

export class IntelligenceController {
  static getBenchmarkMatrix = catchAsync(async (_req: AuthRequest, res: Response) => {
    const rows = await IntelligenceService.getBenchmarkMatrix();
    return ResponseUtil.success(res, rows, 'Mileage benchmark matrix retrieved successfully');
  });

  static upsertOverride = catchAsync(async (req: AuthRequest, res: Response) => {
    const fuel = parseFuelCategory(req.params.fuel_category);

    const dto: UpsertBenchmarkOverrideDto = {
      weak_max: Number(req.body.weak_max),
      average_max: Number(req.body.average_max),
      good_max: Number(req.body.good_max),
    };

    const validation = UpsertBenchmarkOverrideDto.validate(dto);
    if (!validation.valid) {
      throw new AppError(validation.errors.join(', '), 400);
    }

    const updated = await IntelligenceService.upsertOverride(
      req.params.body_type_id as string,
      fuel,
      {
        weak_max: dto.weak_max,
        average_max: dto.average_max,
        good_max: dto.good_max,
      },
      req.user?.user_id
    );

    return ResponseUtil.success(res, updated, 'Benchmark override saved');
  });

  static deleteOverride = catchAsync(async (req: AuthRequest, res: Response) => {
    const fuel = parseFuelCategory(req.params.fuel_category);
    const removed = await IntelligenceService.deleteOverride(req.params.body_type_id as string, fuel);
    if (!removed) {
      throw new AppError('No override existed for this body type and fuel category', 404);
    }
    return ResponseUtil.success(res, { reset: true }, 'Override removed; default thresholds restored');
  });

  static reclassifyAll = catchAsync(async (_req: AuthRequest, res: Response) => {
    const counts = await IntelligenceService.reclassifyAll();
    return ResponseUtil.success(res, counts, `Reclassified ${counts.variants} variant(s) across ${counts.cars} car(s)`);
  });
}
