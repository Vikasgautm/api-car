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
exports.Blog = (0, mongoose_1.model)('Blog', blogSchema);
//# sourceMappingURL=blog.model.js.map