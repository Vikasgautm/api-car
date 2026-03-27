import { CarCompare } from '../../../models/car-compare.model';
import { v4 as uuidv4 } from 'uuid';

export class CarCompareService {
  static async getAllComparisons(query: any) {
    const { page = 1, limit = 10 } = query;
    const filter: any = { is_published: true };

    const skip = (page - 1) * limit;
    const comparisons = await CarCompare.find(filter).skip(skip).limit(Number(limit));
    const total = await CarCompare.countDocuments(filter);

    return { comparisons, total, page, limit };
  }

  static async getComparisonByRoute(route: string) {
    return await CarCompare.findOne({ route_link: route, is_published: true });
  }

  static async createComparison(compareData: any) {
    const car_compare_id = uuidv4();
    
    return await CarCompare.create({
      ...compareData,
      car_compare_id,
    });
  }
}
