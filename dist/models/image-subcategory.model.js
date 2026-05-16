"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageSubCategory = void 0;
const mongoose_1 = require("mongoose");
const imageSubCategorySchema = new mongoose_1.Schema({
    category_id: { type: String, required: true },
    subcategory_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    is_active: { type: Boolean, default: true },
    is_published: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
    display_order: { type: Number, default: 0 },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date },
}, {
    timestamps: true,
});
imageSubCategorySchema.index({ category_id: 1 });
imageSubCategorySchema.index({ is_active: 1 });
imageSubCategorySchema.index({ is_published: 1 });
imageSubCategorySchema.index({ sort_order: 1 });
imageSubCategorySchema.index({ category_id: 1, is_active: 1, sort_order: 1 });
imageSubCategorySchema.index({ category_id: 1, is_published: 1, sort_order: 1 });
exports.ImageSubCategory = (0, mongoose_1.model)('ImageSubCategory', imageSubCategorySchema);
//# sourceMappingURL=image-subcategory.model.js.map