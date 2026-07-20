import { Request, Response } from 'express';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import ElectricCarsModalService from '../service/electric-cars.services';

class ElectricCarsController {
  public getAllElectricCars = catchAsync(async (req: Request, res: Response) => {
    const { page, limit, range, budget, brand, bodyType, seating, q, sort } = req.query;

    const model = new ElectricCarsModalService({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      range: range as string,
      budget: budget as string,
      brand: brand as string,
      bodyType: bodyType as string,
      seating: seating ? Number(seating) : undefined,
      q: q as string,
      sort: sort as string
    });
    const data = await model.getAllElectricCars();

    return ResponseUtil.success(res, data, 'Electric cars retrieved successfully');
  });
}

export const electricCarsController = new ElectricCarsController();