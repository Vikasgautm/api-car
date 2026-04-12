"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarCompareService = void 0;
const car_compare_model_1 = require("../../../models/car-compare.model");
const uuid_1 = require("uuid");
class CarCompareService {
    static async getAllComparisons(query, fetchAsAdmin = false) {
        const { page = 1, limit = 10, is_deleted, q } = query;
        const filter = { is_deleted: is_deleted === "true" };
        if (!fetchAsAdmin && is_deleted !== "true") {
            filter.is_published = true;
        }
        if (q) {
            filter.comparison_title = { $regex: q, $options: "i" };
        }
        const skip = (Number(page) - 1) * Number(limit);
        const comparisons = await car_compare_model_1.CarCompare.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await car_compare_model_1.CarCompare.countDocuments(filter);
        return { comparisons, total, page: Number(page), limit: Number(limit) };
    }
    static async getComparisonByRoute(route) {
        return await car_compare_model_1.CarCompare.findOne({ route_link: route });
    }
    static async updateComparison(id, compareData) {
        return await car_compare_model_1.CarCompare.findOneAndUpdate({ car_compare_id: id }, compareData, { returnDocument: "after" });
    }
    static async deleteComparison(id) {
        return await car_compare_model_1.CarCompare.findOneAndUpdate({ car_compare_id: id }, { is_deleted: true }, { returnDocument: "after" });
    }
    static async restoreComparison(id) {
        return await car_compare_model_1.CarCompare.findOneAndUpdate({ car_compare_id: id }, { is_deleted: false }, { returnDocument: "after" });
    }
    static async createComparison(compareData) {
        const car_compare_id = (0, uuid_1.v4)();
        return await car_compare_model_1.CarCompare.create({
            ...compareData,
            car_compare_id,
        });
    }
}
exports.CarCompareService = CarCompareService;
//# sourceMappingURL=car-compare.service.js.map