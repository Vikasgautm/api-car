"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Brand = void 0;
const mongoose_1 = require("mongoose");
const brandSchema = new mongoose_1.Schema({
    brand_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    logo: {
        title: { type: String },
        url: { type: String },
    },
    website: { type: String },
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
brandSchema.index({ is_deleted: 1 });
brandSchema.index({ is_published: 1 });
brandSchema.index({ is_published: 1, is_deleted: 1 });
brandSchema.index({ is_featured: 1 });
brandSchema.index({ name: 'text' });
exports.Brand = (0, mongoose_1.model)('Brand', brandSchema);
//# sourceMappingURL=brand.model.js.map