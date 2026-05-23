"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardSearchService = void 0;
const blog_model_1 = require("../../../models/blog.model");
const car_model_1 = require("../../../models/car.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
const comparison_model_1 = require("../../../models/comparison.model");
const seo_collection_model_1 = require("../../../models/seo-collection.model");
class DashboardSearchService {
    static async search(query, limit = 5) {
        if (!query || query.trim().length < 2) {
            return { cars: [], variants: [], seo_collections: [], comparisons: [], blogs: [], total: 0 };
        }
        const q = query.trim();
        const regex = new RegExp(q, 'i');
        const [cars, variants, collections, comparisons, blogs] = await Promise.all([
            car_model_1.Car.find({ is_deleted: false, $or: [{ name: regex }, { slug: regex }] })
                .limit(limit)
                .select('car_id name slug brand_id status')
                .lean(),
            car_variant_model_1.CarVariant.find({ is_deleted: false, $or: [{ variant_name: regex }, { variant_id: regex }] })
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
        const carResults = cars.map((c) => ({
            type: 'car',
            id: c.car_id,
            title: c.name,
            subtitle: c.status,
            link: `/cars/${c.car_id}`,
        }));
        const variantResults = variants.map((v) => ({
            type: 'variant',
            id: v.variant_id,
            title: v.variant_name,
            subtitle: v.fuel_type_id ?? undefined,
            link: `/variants/${v.variant_id}`,
        }));
        const collectionResults = collections.map((s) => ({
            type: 'seo_collection',
            id: s.collection_id,
            title: s.title,
            subtitle: s.status,
            link: `/seo-collections/${s.collection_id}`,
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
            link: `/blogs/${b.blog_id}`,
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