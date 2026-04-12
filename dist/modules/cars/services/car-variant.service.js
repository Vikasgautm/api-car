"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarVariantService = void 0;
const car_variant_model_1 = require("../../../models/car-variant.model");
const uuid_1 = require("uuid");
const slugify_1 = require("../../../utils/slugify");
class CarVariantService {
    static async getAllVariants(query, fetchAsAdmin = false) {
        const { car_id, page = 1, limit = 10, q, is_deleted } = query;
        const filter = { is_deleted: is_deleted === "true" };
        if (!fetchAsAdmin && is_deleted !== "true") {
            filter.is_published = true;
        }
        if (car_id)
            filter.car_id = car_id;
        if (q)
            filter.variant_name = { $regex: q, $options: "i" };
        const skip = ((Number(page) || 1) - 1) * (Number(limit) || 10);
        const variants = await car_variant_model_1.CarVariant.find(filter)
            .populate("car_id", "car_name slug")
            .skip(skip)
            .limit(Number(limit) || 10)
            .sort({ createdAt: -1 });
        const total = await car_variant_model_1.CarVariant.countDocuments(filter);
        return {
            variants,
            total,
            page: Number(page) || 1,
            limit: Number(limit) || 10,
        };
    }
    static async getVariantBySlug(slug) {
        return await car_variant_model_1.CarVariant.findOne({ slug, is_deleted: false }).populate("car_id");
    }
    static async createVariant(variantData) {
        const variant_id = (0, uuid_1.v4)();
        let slug = (0, slugify_1.generateSlug)(variantData.variant_name);
        const existing = await car_variant_model_1.CarVariant.findOne({ slug });
        if (existing) {
            slug = `${slug}-${Date.now()}`;
        }
        return await car_variant_model_1.CarVariant.create({
            ...variantData,
            variant_id,
            slug,
        });
    }
    static async updateVariant(id, variantData) {
        if (variantData.variant_name) {
            variantData.slug = (0, slugify_1.generateSlug)(variantData.variant_name);
        }
        return await car_variant_model_1.CarVariant.findByIdAndUpdate(id, variantData, {
            returnDocument: "after",
        });
    }
    static async deleteVariant(id) {
        return await car_variant_model_1.CarVariant.findByIdAndUpdate(id, { is_deleted: true }, { returnDocument: "after" });
    }
    static async restoreVariant(id) {
        return await car_variant_model_1.CarVariant.findByIdAndUpdate(id, { is_deleted: false }, { returnDocument: "after" });
    }
}
exports.CarVariantService = CarVariantService;
//# sourceMappingURL=car-variant.service.js.map