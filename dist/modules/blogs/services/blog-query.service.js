"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogQueryService = void 0;
const blog_model_1 = require("../../../models/blog.model");
const BLOG_PUBLIC_FIELDS = 'blog_id title slug excerpt thumbnail article_type article_status freshness_score is_published createdAt updatedAt connected_cars connected_brands';
class BlogQueryService {
    static async getRelatedByCar(carId, limit = 5) {
        return blog_model_1.Blog.find({
            connected_cars: carId,
            is_published: true,
            is_deleted: false,
            article_status: { $ne: 'archived' },
        })
            .select(BLOG_PUBLIC_FIELDS)
            .sort({ freshness_score: -1, createdAt: -1 })
            .limit(limit)
            .lean();
    }
    static async getRelatedByBrand(brandId, limit = 5) {
        return blog_model_1.Blog.find({
            connected_brands: brandId,
            is_published: true,
            is_deleted: false,
            article_status: { $ne: 'archived' },
        })
            .select(BLOG_PUBLIC_FIELDS)
            .sort({ freshness_score: -1, createdAt: -1 })
            .limit(limit)
            .lean();
    }
    static async getRelatedByFuelType(fuelId, limit = 5) {
        return blog_model_1.Blog.find({
            connected_fuel_types: fuelId,
            is_published: true,
            is_deleted: false,
            article_status: { $ne: 'archived' },
        })
            .select(BLOG_PUBLIC_FIELDS)
            .sort({ freshness_score: -1, createdAt: -1 })
            .limit(limit)
            .lean();
    }
    static async getRelatedByBodyType(bodyTypeId, limit = 5) {
        return blog_model_1.Blog.find({
            connected_body_types: bodyTypeId,
            is_published: true,
            is_deleted: false,
            article_status: { $ne: 'archived' },
        })
            .select(BLOG_PUBLIC_FIELDS)
            .sort({ freshness_score: -1, createdAt: -1 })
            .limit(limit)
            .lean();
    }
    static async getRelatedByComparison(comparisonId, limit = 5) {
        return blog_model_1.Blog.find({
            connected_comparisons: comparisonId,
            is_published: true,
            is_deleted: false,
            article_status: { $ne: 'archived' },
        })
            .select(BLOG_PUBLIC_FIELDS)
            .sort({ freshness_score: -1, createdAt: -1 })
            .limit(limit)
            .lean();
    }
    static async getStaleBlogs(limit = 50) {
        return blog_model_1.Blog.find({
            is_deleted: false,
            is_published: true,
            $or: [
                { freshness_score: { $lt: 60 } },
                { stale_flags: { $exists: true, $not: { $size: 0 } } },
            ],
        })
            .select('blog_id title slug freshness_score stale_flags article_type updatedAt connected_cars connected_brands')
            .sort({ freshness_score: 1 })
            .limit(limit)
            .lean();
    }
    static async getOrphanBlogs(limit = 50) {
        return blog_model_1.Blog.find({
            is_deleted: false,
            connected_cars: { $size: 0 },
            connected_brands: { $size: 0 },
            connected_fuel_types: { $size: 0 },
            connected_body_types: { $size: 0 },
        })
            .select('blog_id title slug article_type is_published createdAt')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    }
}
exports.BlogQueryService = BlogQueryService;
