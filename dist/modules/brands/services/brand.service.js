"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrandService = void 0;
const brand_model_1 = require("../../../models/brand.model");
const uuid_1 = require("uuid");
const slugify_1 = require("../../../utils/slugify");
class BrandService {
    static async getAllBrands(query) {
        const { q, page = 1, limit = 10, is_deleted } = query;
        const filter = { is_deleted: is_deleted === 'true' };
        if (q) {
            filter.brand_name = { $regex: q, $options: 'i' };
        }
        const skip = (Number(page) - 1) * Number(limit);
        const brands = await brand_model_1.Brand.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await brand_model_1.Brand.countDocuments(filter);
        return { brands, total, page: Number(page), limit: Number(limit) };
    }
    static async getBrandBySlug(slug) {
        return await brand_model_1.Brand.findOne({ brand_slug: slug });
    }
    static async updateBrand(id, brandData) {
        return await brand_model_1.Brand.findOneAndUpdate({ brand_uuid: id }, brandData, { new: true });
    }
    static async deleteBrand(id) {
        return await brand_model_1.Brand.findOneAndUpdate({ brand_uuid: id }, { is_deleted: true }, { new: true });
    }
    static async restoreBrand(id) {
        return await brand_model_1.Brand.findOneAndUpdate({ brand_uuid: id }, { is_deleted: false }, { new: true });
    }
    static async createBrand(brandData) {
        const brand_uuid = (0, uuid_1.v4)();
        const brand_slug = (0, slugify_1.generateSlug)(brandData.brand_name);
        return await brand_model_1.Brand.create({
            ...brandData,
            brand_uuid,
            brand_slug,
        });
    }
}
exports.BrandService = BrandService;
//# sourceMappingURL=brand.service.js.map