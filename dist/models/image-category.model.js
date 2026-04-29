"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageCategory = void 0;
const mongoose_1 = require("mongoose");
const imageCategorySchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    is_active: { type: Boolean, default: true },
    display_order: { type: Number, default: 0 },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date },
}, {
    timestamps: true,
});
imageCategorySchema.index({ name: 1 });
imageCategorySchema.index({ is_active: 1 });
imageCategorySchema.index({ display_order: 1 });
imageCategorySchema.index({ is_active: 1, display_order: 1 });
exports.ImageCategory = (0, mongoose_1.model)('ImageCategory', imageCategorySchema);
//# sourceMappingURL=image-category.model.js.map