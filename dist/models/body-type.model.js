"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyType = void 0;
const mongoose_1 = require("mongoose");
const bodyTypeSchema = new mongoose_1.Schema({
    body_type_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    logo: {
        title: { type: String },
        url: { type: String },
    },
}, {
    timestamps: true,
});
bodyTypeSchema.index({ is_deleted: 1 });
bodyTypeSchema.index({ is_published: 1 });
bodyTypeSchema.index({ is_published: 1, is_deleted: 1 });
bodyTypeSchema.index({ is_featured: 1 });
bodyTypeSchema.index({ name: 'text' });
exports.BodyType = (0, mongoose_1.model)('BodyType', bodyTypeSchema);
//# sourceMappingURL=body-type.model.js.map