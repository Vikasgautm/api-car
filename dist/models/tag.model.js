"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tag = void 0;
const mongoose_1 = require("mongoose");
const tagSchema = new mongoose_1.Schema({
    tag_id: { type: String, required: true, unique: true },
    tag_category_id: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String },
    seo_meta: {
        title: { type: String },
        description: { type: String, maxlength: 160 },
        h1: { type: String },
    },
    is_published: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
    sort_order: { type: Number, default: 0 },
}, { timestamps: true });
tagSchema.index({ tag_category_id: 1 });
tagSchema.index({ slug: 1 }, { unique: true });
tagSchema.index({ tag_category_id: 1, slug: 1 });
tagSchema.index({ is_published: 1, is_deleted: 1 });
tagSchema.index({ name: 'text' });
exports.Tag = (0, mongoose_1.model)('Tag', tagSchema);
//# sourceMappingURL=tag.model.js.map