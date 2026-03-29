"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarCompareService = void 0;
const car_compare_model_1 = require("../../../models/car-compare.model");
const uuid_1 = require("uuid");
class CarCompareService {
    static async getAllComparisons(query) {
        const { page = 1, limit = 10 } = query;
        const filter = { is_published: true };
        const skip = (page - 1) * limit;
        const comparisons = await car_compare_model_1.CarCompare.find(filter).skip(skip).limit(Number(limit));
        const total = await car_compare_model_1.CarCompare.countDocuments(filter);
        return { comparisons, total, page, limit };
    }
    static async getComparisonByRoute(route) {
        return await car_compare_model_1.CarCompare.findOne({ route_link: route, is_published: true });
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