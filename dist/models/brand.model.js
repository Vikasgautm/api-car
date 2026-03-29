"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Brand = void 0;
const mongoose_1 = require("mongoose");
const brandSchema = new mongoose_1.Schema({
    brand_uuid: { type: String, required: true, unique: true },
    brand_name: { type: String, required: true },
    brand_slug: { type: String, required: true, unique: true },
    images: {
        type: {
            // preview: { type: String },
            title: { type: String },
            url: { type: String },
        },
        required: true,
    },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
}, { timestamps: true });
exports.Brand = (0, mongoose_1.model)('Brand', brandSchema);
//# sourceMappingURL=brand.model.js.map