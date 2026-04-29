"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Car = void 0;
const mongoose_1 = require("mongoose");
const carSchema = new mongoose_1.Schema({
    car_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    brand_id: { type: String, required: true },
    body_type_id: { type: String, required: true },
    fuel_type_id: { type: String },
    short_description: { type: String },
    description: { type: String, required: true },
    thumbnail: {
        url: { type: String },
        alt: { type: String },
    },
    images: [{
            url: { type: String },
            alt: { type: String },
        }],
    gallery_summary: { type: String },
    status: {
        type: String,
        enum: ['upcoming', 'launched', 'discontinued'],
        default: 'launched'
    },
    is_upcoming: { type: Boolean, default: false },
    is_launched: { type: Boolean, default: true },
    expected_exshowroom_price: { type: Number, default: null },
    expected_launch_date: { type: Date, default: null },
    exshowroom_price: { type: Number, default: null },
    launch_date: { type: Date, default: null },
    is_electric: { type: Boolean, default: false },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    is_popular: { type: Boolean, default: false },
    is_recommended: { type: Boolean, default: false },
    is_latest: { type: Boolean, default: false },
    top_selling: { type: Boolean, default: false },
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
carSchema.index({ brand_id: 1 });
carSchema.index({ body_type_id: 1 });
carSchema.index({ fuel_type_id: 1 });
carSchema.index({ status: 1 });
carSchema.index({ is_published: 1, is_deleted: 1 });
carSchema.index({ is_deleted: 1 });
carSchema.index({ is_published: 1 });
carSchema.index({ is_electric: 1 });
carSchema.index({ is_featured: 1 });
carSchema.index({ is_popular: 1 });
carSchema.index({ is_recommended: 1 });
carSchema.index({ is_latest: 1 });
carSchema.index({ top_selling: 1 });
carSchema.index({ is_upcoming: 1 });
carSchema.index({ is_launched: 1 });
carSchema.index({ expected_launch_date: 1 });
carSchema.index({ launch_date: 1 });
carSchema.index({ name: 'text' });
carSchema.index({ brand_id: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ body_type_id: 1, is_published: 1, is_deleted: 1 });
exports.Car = (0, mongoose_1.model)("Car", carSchema);
//# sourceMappingURL=car.model.js.map