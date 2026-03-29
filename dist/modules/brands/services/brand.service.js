"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrandService = void 0;
const brand_model_1 = require("../../../models/brand.model");
const uuid_1 = require("uuid");
const slugify_1 = require("../../../utils/slugify");
class BrandService {
    static async getAllBrands(query) {
        const { q, page = 1, limit = 10 } = query;
        const filter = { is_deleted: false };
        if (q) {
            filter.brand_name = { $regex: q, $options: 'i' };
        }
        const skip = (page - 1) * limit;
        const brands = await brand_model_1.Brand.find(filter).skip(skip).limit(Number(limit));
        const total = await brand_model_1.Brand.countDocuments(filter);
        return { brands, total, page, limit };
    }
    static async getBrandBySlug(slug) {
        return await brand_model_1.Brand.findOne({ brand_slug: slug, is_deleted: false });
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