"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyType = void 0;
const mongoose_1 = require("mongoose");
const bodyTypeSchema = new mongoose_1.Schema({
    body_type_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    seo_title: { type: String },
    meta_description: { type: String },
    intro_content: { type: String },
    short_description: { type: String },
    hero_image: {
        url: { type: String },
        alt: { type: String },
    },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    sort_order: { type: Number, default: 0 },
    parent_id: { type: String, default: null },
    related_body_types: [{ type: String }],
    logo: {
        title: { type: String },
        url: { type: String },
    },
    created_by: { type: String },
    updated_by: { type: String },
    published_at: { type: Date },
}, {
    timestamps: true,
});
bodyTypeSchema.index({ is_deleted: 1 });
bodyTypeSchema.index({ is_published: 1 });
bodyTypeSchema.index({ is_published: 1, is_deleted: 1 });
bodyTypeSchema.index({ is_featured: 1 });
bodyTypeSchema.index({ sort_order: 1 });
bodyTypeSchema.index({ parent_id: 1 });
bodyTypeSchema.index({ name: 'text', seo_title: 'text', meta_description: 'text' });
exports.BodyType = (0, mongoose_1.model)('BodyType', bodyTypeSchema);
//# sourceMappingURL=body-type.model.js.map