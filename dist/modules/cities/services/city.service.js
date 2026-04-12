"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CityService = void 0;
const city_model_1 = require("../../../models/city.model");
const uuid_1 = require("uuid");
const slugify_1 = require("../../../utils/slugify");
class CityService {
    static async getAllCities(query) {
        const { q, page = 1, limit = 10, is_deleted } = query;
        const filter = { is_deleted: is_deleted === "true" };
        if (q) {
            filter.$or = [
                { city_name: { $regex: q, $options: "i" } },
                { state: { $regex: q, $options: "i" } },
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const cities = await city_model_1.City.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await city_model_1.City.countDocuments(filter);
        return { cities, total, page: Number(page), limit: Number(limit) };
    }
    static async updateCity(id, cityData) {
        return await city_model_1.City.findOneAndUpdate({ city_uuid: id }, cityData, {
            returnDocument: "after",
        });
    }
    static async deleteCity(id) {
        return await city_model_1.City.findOneAndUpdate({ city_uuid: id }, { is_deleted: true }, { returnDocument: "after" });
    }
    static async restoreCity(id) {
        return await city_model_1.City.findOneAndUpdate({ city_uuid: id }, { is_deleted: false }, { returnDocument: "after" });
    }
    static async createCity(cityData) {
        const city_uuid = (0, uuid_1.v4)();
        const slug = (0, slugify_1.generateSlug)(cityData.city_name);
        return await city_model_1.City.create({
            ...cityData,
            city_uuid,
            slug,
        });
    }
}
exports.CityService = CityService;
//# sourceMappingURL=city.service.js.map