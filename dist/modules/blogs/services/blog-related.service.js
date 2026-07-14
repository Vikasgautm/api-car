"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogRelatedService = void 0;
const blog_model_1 = require("../../../models/blog.model");
const PUBLIC_FIELDS = 'blog_id title slug excerpt thumbnail article_type freshness_score is_published createdAt';
class BlogRelatedService {
    static async getRelatedArticles(blogId, limit = 5) {
        const source = await blog_model_1.Blog.findOne({ blog_id: blogId, is_deleted: false })
            .select('connected_cars connected_brands connected_body_types connected_fuel_types connected_comparisons')
            .lean();
        if (!source)
            return [];
        const $or = [];
        if (source.connected_cars?.length)
            $or.push({ connected_cars: { $in: source.connected_cars } });
        if (source.connected_brands?.length)
            $or.push({ connected_brands: { $in: source.connected_brands } });
        if (source.connected_body_types?.length)
            $or.push({ connected_body_types: { $in: source.connected_body_types } });
        if (source.connected_fuel_types?.length)
            $or.push({ connected_fuel_types: { $in: source.connected_fuel_types } });
        if (source.connected_comparisons?.length)
            $or.push({ connected_comparisons: { $in: source.connected_comparisons } });
        if ($or.length === 0)
            return [];
        return blog_model_1.Blog.find({
            blog_id: { $ne: blogId },
            is_deleted: false,
            is_published: true,
            article_status: { $ne: 'archived' },
            $or,
        })
            .select(PUBLIC_FIELDS)
            .sort({ freshness_score: -1, createdAt: -1 })
            .limit(limit)
            .lean();
    }
}
exports.BlogRelatedService = BlogRelatedService;
