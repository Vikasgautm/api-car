"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarImage = void 0;
const mongoose_1 = require("mongoose");
const uuid_1 = require("uuid");
const carImageSchema = new mongoose_1.Schema({
    car_image_id: {
        type: String,
        default: () => (0, uuid_1.v4)(),
        unique: true,
        required: true
    },
    image_uuid: { type: String, sparse: true },
    car_id: { type: String, required: true },
    variant_id: { type: String },
    category_id: { type: String },
    sub_category_id: { type: String },
    url: { type: String, required: true },
    thumbnail_url: { type: String },
    alt_text: { type: String },
    caption: { type: String },
    tags: { type: [String] },
    sort_order: { type: Number, default: 0 },
    display_order: { type: Number, default: 0 },
    is_primary: { type: Boolean, default: false },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    source: { type: String },
    car_condition: { type: String },
    taken_at: { type: Date },
    uploaded_by: { type: String },
    damage_area: { type: String },
    damage_note: { type: String },
    inspection_severity: { type: String },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
}, {
    timestamps: true,
});
carImageSchema.index({ car_id: 1, category_id: 1, sort_order: 1 });
carImageSchema.index({ car_id: 1, sub_category_id: 1, sort_order: 1 });
carImageSchema.index({ car_id: 1, is_primary: 1, is_deleted: 1 });
carImageSchema.index({ variant_id: 1, is_deleted: 1 });
carImageSchema.index({ category_id: 1, sub_category_id: 1 });
carImageSchema.index({ tags: 1 });
carImageSchema.index({ is_published: 1, is_deleted: 1 });
carImageSchema.index({ sort_order: 1 });
carImageSchema.index({ car_id: 1, is_primary: 1 }, {
    unique: true,
    partialFilterExpression: {
        is_primary: true,
        is_deleted: false,
    },
});
exports.CarImage = (0, mongoose_1.model)('CarImage', carImageSchema);
//# sourceMappingURL=car-image.model.js.map