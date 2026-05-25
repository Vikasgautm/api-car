"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopularCollection = void 0;
const mongoose_1 = require("mongoose");
const discoveryFiltersSchema = new mongoose_1.Schema({
    body_type_slugs: [String],
    fuel_type_slugs: [String],
    brand_slugs: [String],
    lifecycle_stages: [String],
    min_price: Number,
    max_price: Number,
    transmission: [String],
    seating_min: Number,
    seating_max: Number,
    tags: [String],
    has_adas: Boolean,
    has_sunroof: Boolean,
    mileage_class: [String],
    is_electric: Boolean,
    vehicle_segment: [String],
    family_friendly: Boolean,
}, { _id: false });
const schema = new mongoose_1.Schema({
    collection_id: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: null },
    description: { type: String, default: null },
    collection_type: {
        type: String,
        enum: ['trending', 'popular', 'ev', 'mileage', 'comparison', 'family', 'launch', 'brand', 'custom'],
        default: 'popular',
    },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    discovery_filters: { type: discoveryFiltersSchema, default: {} },
    default_sort: { type: String, default: 'popularity' },
    ranking_collection_key: { type: String, default: null },
    primary_score_type: {
        type: String,
        enum: ['popularity', 'trending', 'engagement', 'buyer_intent', 'comparison_pressure', 'retention', 'manual'],
        default: 'popularity',
    },
    rendering_mode: {
        type: String,
        enum: ['manual', 'hybrid', 'behavioral', 'observe_only'],
        default: 'manual',
    },
    manual_weight: { type: Number, default: 70, min: 0, max: 100 },
    behavioral_weight: { type: Number, default: 30, min: 0, max: 100 },
    min_behavioral_confidence: { type: Number, default: 70, min: 0, max: 100 },
    pinned_car_ids: [{ type: String }],
    manual_car_ids: [{ type: String }],
    suppressed_car_ids: [{ type: String }],
    hub_preview_limit: { type: Number, default: 5 },
    collection_page_limit: { type: Number, default: 24 },
    display_on_hub: { type: Boolean, default: true },
    hub_section_order: { type: Number, default: 0 },
    hub_section_label: { type: String, default: null },
    view_all_path: { type: String, required: true },
    seo_h1: { type: String, default: null },
    seo_meta_title: { type: String, default: null },
    seo_meta_description: { type: String, default: null },
    seo_intro_content: { type: String, default: null },
    seo_conclusion_content: { type: String, default: null },
    seo_noindex: { type: Boolean, default: false },
    seo_canonical_url: { type: String, default: null },
    related_collection_slugs: [{ type: String }],
    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
    last_rendered_at: { type: Date, default: null },
}, { timestamps: true });
schema.index({ status: 1 });
schema.index({ collection_type: 1 });
schema.index({ display_on_hub: 1, hub_section_order: 1 });
exports.PopularCollection = (0, mongoose_1.model)('PopularCollection', schema);
//# sourceMappingURL=popular-collection.model.js.map