"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Image = void 0;
const mongoose_1 = require("mongoose");
const imageSchema = new mongoose_1.Schema({
    url: { type: String, required: true },
    public_id: { type: String, index: true },
    original_name: { type: String, required: true },
    mime_type: { type: String, required: true },
    size: { type: Number, required: true },
    folder: { type: String },
    alt_text: { type: String },
    caption: { type: String },
    tags: { type: [String] },
    uploaded_by: { type: String },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false, index: true },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
}, {
    timestamps: true,
});
imageSchema.index({ folder: 1, is_deleted: 1 });
imageSchema.index({ uploaded_by: 1, is_deleted: 1 });
imageSchema.index({ mime_type: 1 });
imageSchema.index({ tags: 1 });
imageSchema.index({ is_published: 1, is_deleted: 1 });
exports.Image = (0, mongoose_1.model)('Image', imageSchema);
//# sourceMappingURL=image.model.js.map