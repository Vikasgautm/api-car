"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogFreshnessService = void 0;
const blog_model_1 = require("../../../models/blog.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
class BlogFreshnessService {
    static async checkBlog(blogId) {
        const blog = await blog_model_1.Blog.findOne({ blog_id: blogId, is_deleted: false })
            .select('blog_id title connected_cars connected_brands connected_comparisons updatedAt freshness_score stale_flags')
            .lean();
        if (!blog)
            throw app_error_util_1.AppError.notFound('Blog');
        const Car = (await Promise.resolve().then(() => __importStar(require('../../../models/car.model')))).Car;
        const stale_flags = [];
        let scoreDeduction = 0;
        // Check if connected cars are still active
        if (blog.connected_cars?.length) {
            const cars = await Car.find({ car_id: { $in: blog.connected_cars } })
                .select('car_id status is_published')
                .lean();
            const foundIds = new Set(cars.map((c) => c.car_id));
            const missingCount = blog.connected_cars.filter((id) => !foundIds.has(id)).length;
            const discontinuedCount = cars.filter((c) => c.status === 'discontinued' || !c.is_published).length;
            if (missingCount > 0) {
                stale_flags.push(`${missingCount}_connected_car(s)_not_found`);
                scoreDeduction += missingCount * 15;
            }
            if (discontinuedCount > 0) {
                stale_flags.push(`${discontinuedCount}_connected_car(s)_discontinued`);
                scoreDeduction += discontinuedCount * 10;
            }
        }
        // Age-based freshness decay
        const ageMs = Date.now() - new Date(blog.updatedAt).getTime();
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        if (ageDays > 365) {
            stale_flags.push('article_older_than_1_year');
            scoreDeduction += 20;
        }
        else if (ageDays > 180) {
            stale_flags.push('article_older_than_6_months');
            scoreDeduction += 10;
        }
        else if (ageDays > 90) {
            stale_flags.push('article_older_than_3_months');
            scoreDeduction += 5;
        }
        const freshness_score = Math.max(0, 100 - scoreDeduction);
        const article_status = freshness_score < 40 ? 'stale' : undefined;
        const updateData = { freshness_score, stale_flags };
        if (article_status)
            updateData.article_status = article_status;
        await blog_model_1.Blog.updateOne({ blog_id: blogId }, { $set: updateData });
        return { blog_id: blogId, freshness_score, stale_flags, article_status };
    }
    static async runBulkFreshnessCheck(limit = 200) {
        const blogs = await blog_model_1.Blog.find({ is_deleted: false, is_published: true })
            .select('blog_id connected_cars updatedAt')
            .limit(limit)
            .lean();
        const results = await Promise.allSettled(blogs.map((b) => this.checkBlog(b.blog_id)));
        const succeeded = results.filter((r) => r.status === 'fulfilled').length;
        const stale = results
            .filter((r) => r.status === 'fulfilled')
            .filter((r) => r.value.freshness_score < 60).length;
        return { processed: blogs.length, succeeded, stale };
    }
}
exports.BlogFreshnessService = BlogFreshnessService;
//# sourceMappingURL=blog-freshness.service.js.map