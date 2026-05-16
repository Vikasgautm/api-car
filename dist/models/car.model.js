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
        enum: ['upcoming', 'launched', 'discontinued', 'archived', 'disabled'],
        default: 'launched'
    },
    is_upcoming: { type: Boolean, default: false },
    is_launched: { type: Boolean, default: true },
    expected_exshowroom_price: { type: Number, default: null },
    expected_launch_date: { type: Date, default: null },
    ex_showroom_price: { type: Number, default: null },
    exshowroom_price: { type: Number, default: null },
    launch_date: { type: Date, default: null },
    is_electric: { type: Boolean, default: false },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    archived_at: { type: Date, default: null },
    archived_by: { type: String, default: null },
    disabled_at: { type: Date, default: null },
    disabled_by: { type: String, default: null },
    discontinued_at: { type: Date, default: null },
    discontinued_by: { type: String, default: null },
    redirect_to_slug: { type: String, default: null },
    model_family: { type: String, default: null, trim: true, lowercase: true },
    generation_start_year: { type: Number, default: null, min: 1900, max: 2200 },
    generation_end_year: { type: Number, default: null, min: 1900, max: 2200 },
    generation_label: { type: String, default: null, trim: true, maxlength: 120 },
    is_current: { type: Boolean, default: false },
    is_facelift: { type: Boolean, default: false },
    predecessor_car_id: { type: String, default: null },
    successor_car_id: { type: String, default: null },
    is_featured: { type: Boolean, default: false },
    is_popular: { type: Boolean, default: false },
    is_recommended: { type: Boolean, default: false },
    is_latest: { type: Boolean, default: false },
    top_selling: { type: Boolean, default: false },
    tag_ids: { type: [String], default: [] },
    best_mileage_class: { type: String, enum: ['weak', 'average', 'good', 'excellent', null], default: null },
    best_mileage_value: { type: Number, default: null },
    best_range_class: { type: String, enum: ['weak', 'average', 'good', 'excellent', null], default: null },
    best_range_value: { type: Number, default: null },
    variant_count: { type: Number, default: 0 },
    incomplete_variant_count: { type: Number, default: 0 },
    min_variant_price: { type: Number, default: null },
    max_variant_price: { type: Number, default: null },
    // SEO health and completeness metrics
    seo_health_issues: { type: [String], default: [] },
    completeness_score: { type: Number, default: 0 },
    completeness_misses: {
        type: [{
                key: String,
                label: String,
                severity: String
            }],
        default: []
    },
    aggregated_fuel_types: { type: [String], default: [] },
    body_type_name: { type: String, default: null },
    editor_user_id: { type: String, default: null },
    seo_owner_user_id: { type: String, default: null },
    reviewer_user_id: { type: String, default: null },
    last_reviewed_at: { type: Date, default: null },
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
carSchema.index({ tag_ids: 1 });
carSchema.index({ tag_ids: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ best_mileage_class: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ best_range_class: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ best_mileage_value: -1 });
carSchema.index({ best_range_value: -1 });
carSchema.index({ aggregated_fuel_types: 1 });
carSchema.index({ min_variant_price: 1 });
carSchema.index({ max_variant_price: 1 });
carSchema.index({ body_type_name: 1 });
carSchema.index({ incomplete_variant_count: 1 });
carSchema.index({ editor_user_id: 1 });
carSchema.index({ seo_owner_user_id: 1 });
carSchema.index({ reviewer_user_id: 1 });
carSchema.index({ last_reviewed_at: -1 });
carSchema.index({ status: 1, is_deleted: 1, is_published: 1 });
carSchema.index({ archived_at: -1 });
carSchema.index({ disabled_at: -1 });
carSchema.index({ discontinued_at: -1 });
// Generation / lifecycle indexes
carSchema.index({ model_family: 1 });
carSchema.index({ model_family: 1, is_current: 1 });
carSchema.index({ model_family: 1, generation_start_year: 1 });
// Additional compound indexes for common query patterns
carSchema.index({ brand_id: 1, model_family: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ body_type_id: 1, model_family: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ is_electric: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ is_featured: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ is_popular: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ is_recommended: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ is_latest: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ top_selling: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ is_upcoming: 1, is_published: 1, is_deleted: 1 });
// SEO health and completeness indexes
carSchema.index({ completeness_score: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ seo_health_issues: 1, is_published: 1, is_deleted: 1 });
// One current generation per model_family (DB-level safety net for the
// promote-to-current workflow). Only enforced for rows that actually have a
// model_family set and are flagged current, so cars without a family yet
// don't collide on null.
carSchema.index({ model_family: 1, is_current: 1 }, {
    unique: true,
    partialFilterExpression: {
        is_current: true,
        model_family: { $type: 'string' },
    },
    name: 'uniq_current_per_family',
});
exports.Car = (0, mongoose_1.model)("Car", carSchema);
//# sourceMappingURL=car.model.js.map