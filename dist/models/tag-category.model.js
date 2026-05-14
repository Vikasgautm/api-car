"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagCategory = void 0;
const mongoose_1 = require("mongoose");
const tagCategorySchema = new mongoose_1.Schema({
    tag_category_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    type: { type: String, required: true, default: 'intent' },
    description: { type: String },
    is_published: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
    sort_order: { type: Number, default: 0 },
}, { timestamps: true });
tagCategorySchema.index({ type: 1 });
tagCategorySchema.index({ is_published: 1, is_deleted: 1 });
tagCategorySchema.index({ name: 'text' });
exports.TagCategory = (0, mongoose_1.model)('TagCategory', tagCategorySchema);
//# sourceMappingURL=tag-category.model.js.map