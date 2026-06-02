"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardSearchService = void 0;
const blog_model_1 = require("../../../models/blog.model");
const brand_model_1 = require("../../../models/brand.model");
const car_model_1 = require("../../../models/car.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
const comparison_model_1 = require("../../../models/comparison.model");
const fuel_type_model_1 = require("../../../models/fuel-type.model");
const seo_collection_model_1 = require("../../../models/seo-collection.model");
class DashboardSearchService {
    static async search(query, limit = 5) {
        if (!query || query.trim().length < 2) {
            return { cars: [], variants: [], seo_collections: [], comparisons: [], blogs: [], total: 0 };
        }
        const q = query.trim();
        const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        // Resolve brand IDs matching the query so "Honda" finds Honda City, etc.
        const matchedBrands = await brand_model_1.Brand.find({ name: regex, is_deleted: false }).select('brand_id').lean();
        const matchedBrandIds = matchedBrands.map((b) => b.brand_id);
        const carOrClauses = [{ name: regex }, { slug: regex }, { body_type_name: regex }];
        if (matchedBrandIds.length > 0)
            carOrClauses.push({ brand_id: { $in: matchedBrandIds } });
        const [cars, variants, collections, comparisons, blogs] = await Promise.all([
            car_model_1.Car.find({ is_deleted: false, $or: carOrClauses })
                .limit(limit)
                .select('car_id name slug brand_id body_type_name status')
                .lean(),
            car_variant_model_1.CarVariant.find({ is_deleted: false, $or: [{ variant_name: regex }, { slug: regex }] })
                .limit(limit)
                .select('variant_id variant_name car_id fuel_type_id')
                .lean(),
            seo_collection_model_1.SeoCollection.find({ is_deleted: false, $or: [{ title: regex }, { slug: regex }] })
                .limit(limit)
                .select('collection_id title slug status')
                .lean(),
            comparison_model_1.Comparison.find({ is_deleted: false, $or: [{ title: regex }, { slug: regex }] })
                .limit(limit)
                .select('comparison_id title slug status')
                .lean(),
            blog_model_1.Blog.find({ is_deleted: false, $or: [{ title: regex }, { slug: regex }] })
                .limit(limit)
                .select('blog_id title slug')
                .lean(),
        ]);
        // Enrich car results with brand name
        const brandIds = [...new Set(cars.map((c) => c.brand_id).filter(Boolean))];
        const [brandDocs, fuelTypeDocs] = await Promise.all([
            brandIds.length > 0
                ? brand_model_1.Brand.find({ brand_id: { $in: brandIds }, is_deleted: false }).select('brand_id name').lean()
                : Promise.resolve([]),
            variants.length > 0
                ? fuel_type_model_1.FuelType.find({ fuel_type_id: { $in: variants.map((v) => v.fuel_type_id).filter(Boolean) }, is_deleted: false })
                    .select('fuel_type_id name').lean()
                : Promise.resolve([]),
        ]);
        const brandNameMap = new Map(brandDocs.map((b) => [b.brand_id, b.name]));
        const fuelNameMap = new Map(fuelTypeDocs.map((f) => [f.fuel_type_id, f.name]));
        const carResults = cars.map((c) => ({
            type: 'car',
            id: c.car_id,
            title: c.name,
            subtitle: [brandNameMap.get(c.brand_id), c.body_type_name, c.status].filter(Boolean).join(' · '),
            link: `/cars?editId=${c.car_id}`,
        }));
        const variantResults = variants.map((v) => ({
            type: 'variant',
            id: v.variant_id,
            title: v.variant_name,
            subtitle: fuelNameMap.get(v.fuel_type_id) ?? undefined,
            link: `/variants/${v.variant_id}/edit`,
        }));
        const collectionResults = collections.map((s) => ({
            type: 'seo_collection',
            id: s.collection_id,
            title: s.title,
            subtitle: s.status,
            link: `/seo-collection-editor/${s.collection_id}`,
        }));
        const comparisonResults = comparisons.map((c) => ({
            type: 'comparison',
            id: c.comparison_id,
            title: c.title,
            subtitle: c.status,
            link: `/comparison/${c.comparison_id}`,
        }));
        const blogResults = blogs.map((b) => ({
            type: 'blog',
            id: b.blog_id,
            title: b.title,
            link: `/blogs`,
        }));
        const total = carResults.length + variantResults.length + collectionResults.length + comparisonResults.length + blogResults.length;
        return {
            cars: carResults,
            variants: variantResults,
            seo_collections: collectionResults,
            comparisons: comparisonResults,
            blogs: blogResults,
            total,
        };
    }
}
exports.DashboardSearchService = DashboardSearchService;
//# sourceMappingURL=dashboard-search.service.js.map