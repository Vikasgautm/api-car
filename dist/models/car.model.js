"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Car = void 0;
const mongoose_1 = require("mongoose");
const carSchema = new mongoose_1.Schema({
    car_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
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
    min_on_road_price: { type: Number, default: null },
    max_on_road_price: { type: Number, default: null },
    min_emi: { type: Number, default: null },
    max_emi: { type: Number, default: null },
    aggregated_transmission_types: { type: [String], default: [] },
    aggregated_drive_types: { type: [String], default: [] },
    engine_options: { type: [String], default: [] },
    battery_options: { type: [Number], default: [] },
    power_min_bhp: { type: Number, default: null },
    power_max_bhp: { type: Number, default: null },
    torque_min_nm: { type: Number, default: null },
    torque_max_nm: { type: Number, default: null },
    mileage_min_kmpl: { type: Number, default: null },
    mileage_max_kmpl: { type: Number, default: null },
    range_min_km: { type: Number, default: null },
    range_max_km: { type: Number, default: null },
    ground_clearance_mm: { type: Number, default: null },
    boot_space_l: { type: Number, default: null },
    wheelbase_mm: { type: Number, default: null },
    max_seating_capacity: { type: Number, default: null },
    sunroof_available: { type: Boolean, default: false },
    adas_available: { type: Boolean, default: false },
    ventilated_seats_available: { type: Boolean, default: false },
    camera_360_available: { type: Boolean, default: false },
    connected_car_available: { type: Boolean, default: false },
    wireless_charger_available: { type: Boolean, default: false },
    air_purifier_available: { type: Boolean, default: false },
    panoramic_sunroof_available: { type: Boolean, default: false },
    max_airbags: { type: Number, default: null },
    best_ncap_rating: { type: Number, default: null, min: 0, max: 5 },
    best_bncap_rating: { type: Number, default: null, min: 0, max: 5 },
    best_global_ncap_rating: { type: Number, default: null, min: 0, max: 5 },
    best_adas_level: { type: Number, default: null, min: 0, max: 5 },
    vehicle_segment: { type: String, default: null, trim: true },
    family_friendly: { type: Boolean, default: false },
    city_friendly: { type: Boolean, default: false },
    highway_friendly: { type: Boolean, default: false },
    offroad_ready: { type: Boolean, default: false },
    feature_loaded: { type: Boolean, default: false },
    premium_cabin: { type: Boolean, default: false },
    budget_friendly: { type: Boolean, default: false },
    performance_focused: { type: Boolean, default: false },
    seo_tags: { type: [String], default: [] },
    buyer_intent_tags: { type: [String], default: [] },
    search_intent_tags: { type: [String], default: [] },
    ai_intelligence_meta: {
        confidence_scores: { type: mongoose_1.Schema.Types.Mixed, default: {} },
        flag_rationale: { type: mongoose_1.Schema.Types.Mixed, default: {} },
        refined_by_llm: { type: [String], default: [] },
        last_refined_at: { type: Date, default: null },
        model_used: { type: String, default: null },
    },
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
    // Evolutionary lifecycle system
    entity_lifecycle_state: {
        type: String,
        enum: ['upcoming', 'launched', 'facelift', 'discontinued', 'concept', 'testing'],
        default: null,
    },
    entity_created_at: { type: Date, default: null },
    entity_launch_date: { type: Date, default: null },
    entity_status_history: [{
            previous_state: {
                type: String,
                enum: ['upcoming', 'launched', 'facelift', 'discontinued', 'concept', 'testing', null],
                default: null,
            },
            state: {
                type: String,
                enum: ['upcoming', 'launched', 'facelift', 'discontinued', 'concept', 'testing'],
                required: true,
            },
            changed_at: { type: Date, required: true },
            changed_by: { type: String, required: true },
            reason: { type: String, default: null },
            actor_role: { type: String, default: null },
            otp_verified: { type: Boolean, default: false },
            override_used: { type: Boolean, default: false },
            request_id: { type: String, default: null },
            approval_status: { type: String, default: null },
        }],
    seo_history: [{
            field: { type: String, required: true },
            old_value: { type: mongoose_1.Schema.Types.Mixed },
            new_value: { type: mongoose_1.Schema.Types.Mixed },
            timestamp: { type: Date, required: true },
            changed_by: { type: String, required: true },
        }],
    variant_history: [{
            variant_id: { type: String, required: true },
            action: {
                type: String,
                enum: ['added', 'removed', 'visibility_changed', 'specs_updated'],
                required: true,
            },
            timestamp: { type: Date, required: true },
            changed_by: { type: String, required: true },
            details: { type: mongoose_1.Schema.Types.Mixed, default: {} },
        }],
    change_history: [{
            field: { type: String, required: true },
            old_value: { type: mongoose_1.Schema.Types.Mixed },
            new_value: { type: mongoose_1.Schema.Types.Mixed },
            changed_by: { type: String, required: true },
            changed_at: { type: Date, required: true },
            change_source: {
                type: String,
                enum: ['manual_edit', 'import', 'bulk_operation', 'system', 'api'],
                required: true,
            },
            notes: { type: String },
        }],
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
// Aggregated intelligence indexes — drive SEO landing pages ("cars with sunroof", "ADAS cars", etc.)
carSchema.index({ aggregated_transmission_types: 1 });
carSchema.index({ aggregated_drive_types: 1 });
carSchema.index({ vehicle_segment: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ sunroof_available: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ adas_available: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ camera_360_available: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ ventilated_seats_available: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ connected_car_available: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ panoramic_sunroof_available: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ max_airbags: -1 });
carSchema.index({ best_ncap_rating: -1 });
carSchema.index({ power_max_bhp: -1 });
carSchema.index({ torque_max_nm: -1 });
carSchema.index({ family_friendly: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ city_friendly: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ offroad_ready: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ feature_loaded: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ premium_cabin: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ budget_friendly: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ performance_focused: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ seo_tags: 1 });
carSchema.index({ buyer_intent_tags: 1 });
// Evolutionary lifecycle system indexes
carSchema.index({ entity_lifecycle_state: 1 });
carSchema.index({ entity_lifecycle_state: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ entity_launch_date: 1 });
carSchema.index({ 'entity_status_history.state': 1 });
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
// Slug must be unique only among non-deleted cars so admins can reuse the slug
// of a soft-deleted car without hitting E11000. In production, drop the old
// global 'slug_1' index first: db.cars.dropIndex("slug_1")
carSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { is_deleted: false }, name: 'uniq_slug_active' });
exports.Car = (0, mongoose_1.model)("Car", carSchema);
//# sourceMappingURL=car.model.js.map