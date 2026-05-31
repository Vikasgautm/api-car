"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogHealthService = void 0;
const blog_model_1 = require("../../../models/blog.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
function scoreFromChecks(checks) {
    const weights = {
        critical: 25,
        high: 15,
        medium: 8,
        low: 4,
    };
    let deducted = 0;
    for (const c of checks) {
        if (!c.passed)
            deducted += weights[c.severity] ?? 0;
    }
    return Math.max(0, 100 - deducted);
}
class BlogHealthService {
    static runChecks(blog) {
        const content = blog.content ?? '';
        const headingCount = (content.match(/<h[1-6][^>]*>/gi) ?? []).length;
        const internalLinks = (content.match(/href="[^"]*"/gi) ?? []).length;
        return [
            {
                code: 'missing_meta_title',
                label: 'Meta title missing',
                passed: !!blog.meta_title?.trim(),
                severity: 'high',
            },
            {
                code: 'missing_meta_description',
                label: 'Meta description missing',
                passed: !!blog.meta_description?.trim(),
                severity: 'high',
            },
            {
                code: 'missing_featured_image',
                label: 'Featured image missing',
                passed: !!blog.thumbnail?.url,
                severity: 'medium',
            },
            {
                code: 'no_internal_links',
                label: 'No internal links in content',
                passed: internalLinks > 0,
                severity: 'medium',
            },
            {
                code: 'no_target_keyword',
                label: 'Target keyword not set',
                passed: !!blog.target_keyword?.trim(),
                severity: 'medium',
            },
            {
                code: 'weak_heading_structure',
                label: 'Content has no heading tags',
                passed: headingCount > 0,
                severity: 'low',
            },
            {
                code: 'no_related_entities',
                label: 'No automotive entities connected',
                passed: !!((blog.connected_cars?.length ?? 0) > 0 ||
                    (blog.connected_brands?.length ?? 0) > 0 ||
                    (blog.connected_fuel_types?.length ?? 0) > 0),
                severity: 'medium',
            },
            {
                code: 'no_article_type',
                label: 'Article type not classified',
                passed: !!blog.article_type,
                severity: 'low',
            },
            {
                code: 'short_content',
                label: 'Content is too short (under 300 chars)',
                passed: content.replace(/<[^>]+>/g, '').length >= 300,
                severity: 'high',
            },
        ];
    }
    static async computeForBlog(blogId) {
        const blog = await blog_model_1.Blog.findOne({ blog_id: blogId, is_deleted: false }).lean();
        if (!blog)
            throw app_error_util_1.AppError.notFound('Blog');
        const checks = this.runChecks(blog);
        const score = scoreFromChecks(checks);
        await blog_model_1.Blog.updateOne({ blog_id: blogId }, { seo_health_score: score });
        return {
            blog_id: blog.blog_id,
            title: blog.title,
            slug: blog.slug,
            seo_health_score: score,
            checks,
            generated_at: new Date().toISOString(),
        };
    }
    static async computeBulk(limit = 100) {
        const blogs = await blog_model_1.Blog.find({ is_deleted: false })
            .select('blog_id title slug content meta_title meta_description thumbnail target_keyword article_type connected_cars connected_brands connected_fuel_types')
            .limit(limit)
            .lean();
        let totalScore = 0;
        const updates = blogs.map((blog) => {
            const checks = this.runChecks(blog);
            const score = scoreFromChecks(checks);
            totalScore += score;
            return {
                updateOne: {
                    filter: { blog_id: blog.blog_id },
                    update: { $set: { seo_health_score: score } },
                },
            };
        });
        if (updates.length > 0) {
            await blog_model_1.Blog.bulkWrite(updates);
        }
        return {
            processed: blogs.length,
            average_score: blogs.length ? Math.round(totalScore / blogs.length) : 0,
        };
    }
}
exports.BlogHealthService = BlogHealthService;
//# sourceMappingURL=blog-health.service.js.map