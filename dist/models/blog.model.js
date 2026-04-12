"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Blog = void 0;
const mongoose_1 = require("mongoose");
const blogSchema = new mongoose_1.Schema({
    blog_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    excerpt: {
        type: String,
        maxlength: [300, "Excerpt cannot be more than 300 characters"],
    },
    author: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true, default: "Uncategorized" },
    link: { type: String },
    thumbnail: {
        type: {
            preview: { type: String },
            title: { type: String },
            url: { type: String },
        },
        required: true,
    },
    images: [String],
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    // SEO fields
    meta_title: { type: String },
    meta_description: { type: String, maxlength: 160 },
    meta_keywords: { type: String },
    og_image: { type: String },
    canonical_url: { type: String },
    noindex: { type: Boolean, default: false },
}, { timestamps: true });
exports.Blog = (0, mongoose_1.model)("Blog", blogSchema);
//# sourceMappingURL=blog.model.js.map