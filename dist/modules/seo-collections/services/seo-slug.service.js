"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoSlugService = void 0;
const body_type_model_1 = require("../../../models/body-type.model");
const brand_model_1 = require("../../../models/brand.model");
const fuel_type_model_1 = require("../../../models/fuel-type.model");
const seo_collection_model_1 = require("../../../models/seo-collection.model");
const slug_util_1 = require("../../../shared/utils/slug.util");
class SeoSlugService {
    static async generate(params) {
        const parts = [];
        if (params.fuel_type_ids?.length) {
            const fuelTypes = await fuel_type_model_1.FuelType.find({ fuel_type_id: { $in: params.fuel_type_ids } }).select('name').lean();
            for (const ft of fuelTypes)
                parts.push(slug_util_1.SlugUtil.generate(ft.name));
        }
        if (params.body_type_ids?.length) {
            const bodyTypes = await body_type_model_1.BodyType.find({ body_type_id: { $in: params.body_type_ids } }).select('name').lean();
            for (const bt of bodyTypes)
                parts.push(slug_util_1.SlugUtil.generate(bt.name));
        }
        if (params.brand_ids?.length) {
            const brands = await brand_model_1.Brand.find({ brand_id: { $in: params.brand_ids } }).select('name').lean();
            for (const b of brands)
                parts.push(slug_util_1.SlugUtil.generate(b.name));
        }
        if (params.transmission_types?.length === 1) {
            parts.push(slug_util_1.SlugUtil.generate(params.transmission_types[0]));
        }
        if (params.mileage_classes?.length && params.mileage_classes.includes('excellent')) {
            parts.unshift('best-mileage');
        }
        // Always end base with "cars"
        parts.push('cars');
        if (params.budget_max) {
            const lakhs = Math.round(params.budget_max / 100000);
            parts.push(`under-${lakhs}-lakh`);
        }
        else if (params.budget_min) {
            const lakhs = Math.round(params.budget_min / 100000);
            parts.push(`above-${lakhs}-lakh`);
        }
        const baseSlug = parts.join('-');
        return this.ensureUnique(baseSlug);
    }
    static async ensureUnique(baseSlug, excludeId) {
        let slug = baseSlug;
        let counter = 1;
        while (true) {
            const q = { slug, is_deleted: false };
            if (excludeId)
                q.collection_id = { $ne: excludeId };
            const exists = await seo_collection_model_1.SeoCollection.exists(q);
            if (!exists)
                return slug;
            slug = `${baseSlug}-${counter++}`;
        }
    }
}
exports.SeoSlugService = SeoSlugService;
