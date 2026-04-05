import { CarCompare } from "../../../models/car-compare.model";
import { v4 as uuidv4 } from "uuid";

export class CarCompareService {
  static async getAllComparisons(query: any, fetchAsAdmin = false) {
    const { page = 1, limit = 10, is_deleted, q } = query;
    const filter: any = { is_deleted: is_deleted === "true" };
    if (!fetchAsAdmin && is_deleted !== "true") {
      filter.is_published = true;
    }

    if (q) {
      filter.comparison_title = { $regex: q, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const comparisons = await CarCompare.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await CarCompare.countDocuments(filter);

    return { comparisons, total, page: Number(page), limit: Number(limit) };
  }

  static async getComparisonByRoute(route: string) {
    return await CarCompare.findOne({ route_link: route });
  }

  static async updateComparison(id: string, compareData: any) {
    return await CarCompare.findOneAndUpdate(
      { car_compare_id: id },
      compareData,
      { returnDocument: "after" },
    );
  }

  static async deleteComparison(id: string) {
    return await CarCompare.findOneAndUpdate(
      { car_compare_id: id },
      { is_deleted: true },
      { returnDocument: "after" },
    );
  }

  static async restoreComparison(id: string) {
    return await CarCompare.findOneAndUpdate(
      { car_compare_id: id },
      { is_deleted: false },
      { returnDocument: "after" },
    );
  }

  static async createComparison(compareData: any) {
    const car_compare_id = uuidv4();

    return await CarCompare.create({
      ...compareData,
      car_compare_id,
    });
  }
}
