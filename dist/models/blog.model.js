"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Blog = void 0;
const mongoose_1 = require("mongoose");
const blogSchema = new mongoose_1.Schema({
    blog_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true, maxlength: 500 },
    content: { type: String, required: true },
    author_name: { type: String },
    author_id: { type: String },
    category: { type: String, required: true },
    tags: [{ type: String }],
    thumbnail: {
        url: { type: String },
        alt: { type: String },
    },
    images: [{
            url: { type: String },
            alt: { type: String },
        }],
    link: { type: String },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    // SEO fields
    meta_title: { type: String },
    meta_description: { type: String, maxlength: 160 },
    meta_keywords: { type: String },
    og_image: { type: String },
    canonical_url: { type: String },
    noindex: { type: Boolean, default: false },
    // Content classification
    article_type: { type: String, enum: ['review', 'comparison', 'news', 'guide', 'listicle', 'opinion', 'launch', 'first_drive'] },
    article_status: { type: String, enum: ['draft', 'review', 'published', 'archived', 'stale'], default: 'draft' },
    article_intent: { type: String, enum: ['informational', 'commercial', 'transactional', 'navigational'] },
    target_keyword: { type: String },
    freshness_score: { type: Number, min: 0, max: 100, default: 100 },
    seo_health_score: { type: Number, min: 0, max: 100 },
    stale_flags: [{ type: String }],
    last_verified_at: { type: Date },
    internal_link_count: { type: Number, default: 0 },
    related_articles_count: { type: Number, default: 0 },
    // Ecosystem relationships (store entity IDs)
    connected_cars: [{ type: String }],
    connected_variants: [{ type: String }],
    connected_brands: [{ type: String }],
    connected_body_types: [{ type: String }],
    connected_fuel_types: [{ type: String }],
    connected_comparisons: [{ type: String }],
    connected_collections: [{ type: String }],
}, {
    timestamps: true,
});
blogSchema.index({ author_id: 1 });
blogSchema.index({ author_name: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ is_published: 1, is_deleted: 1 });
blogSchema.index({ is_featured: 1 });
blogSchema.index({ title: 'text', content: 'text', excerpt: 'text' });
// Automotive intelligence indexes
blogSchema.index({ connected_cars: 1 });
blogSchema.index({ connected_brands: 1 });
blogSchema.index({ connected_fuel_types: 1 });
blogSchema.index({ connected_body_types: 1 });
blogSchema.index({ connected_comparisons: 1 });
blogSchema.index({ connected_collections: 1 });
blogSchema.index({ article_type: 1 });
blogSchema.index({ article_status: 1 });
blogSchema.index({ freshness_score: -1 });
blogSchema.index({ target_keyword: 1 });
exports.Blog = (0, mongoose_1.model)('Blog', blogSchema);
//# sourceMappingURL=blog.model.js.map