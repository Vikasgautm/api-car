"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoCollection = void 0;
const mongoose_1 = require("mongoose");
const seoMetaSchema = new mongoose_1.Schema({
    h1: { type: String, default: null },
    meta_title: { type: String, default: null, maxlength: 70 },
    meta_description: { type: String, default: null, maxlength: 160 },
    canonical_url: { type: String, default: null },
    og_title: { type: String, default: null },
    og_description: { type: String, default: null },
    intro_content: { type: String, default: null, maxlength: 5000 },
    conclusion_content: { type: String, default: null, maxlength: 5000 },
}, { _id: false });
const faqItemSchema = new mongoose_1.Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
}, { _id: false });
const SEO_COLLECTION_TYPES = [
    'fuel', 'fuel_body_type', 'fuel_budget', 'fuel_body_budget',
    'fuel_feature', 'fuel_transmission', 'fuel_seating', 'fuel_mileage',
    'fuel_usage', 'fuel_safety', 'fuel_family', 'fuel_brand', 'future_custom',
];
const seoCollectionSchema = new mongoose_1.Schema({
    collection_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    collection_type: { type: String, required: true, enum: SEO_COLLECTION_TYPES },
    primary_keyword: { type: String, default: null },
    fuel_type_ids: [{ type: String }],
    body_type_ids: [{ type: String }],
    brand_ids: [{ type: String }],
    transmission_types: [{ type: String }],
    seating_capacities: [{ type: Number }],
    feature_flags: [{ type: String }],
    mileage_classes: [{ type: String }],
    budget_min: { type: Number, default: null },
    budget_max: { type: Number, default: null },
    usage_intents: [{ type: String }],
    ownership_intents: [{ type: String }],
    safety_intents: [{ type: String }],
    family_intents: [{ type: String }],
    generated_query: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    matched_car_count: { type: Number, default: 0 },
    related_collection_ids: [{ type: String }],
    seo: { type: seoMetaSchema, default: () => ({}) },
    faq_items: [faqItemSchema],
    seo_index_status: { type: String, enum: ['index', 'noindex'], default: 'index' },
    auto_noindex: { type: Boolean, default: false },
    health_score: { type: Number, default: 0, min: 0, max: 100 },
    duplicate_risk_score: { type: Number, default: 0, min: 0, max: 100 },
    overlap_percentage: { type: Number, default: 0, min: 0, max: 100 },
    featured_rank: { type: Number, default: null },
    priority_score: { type: Number, default: 0 },
    auto_generated: { type: Boolean, default: false },
    last_refreshed_at: { type: Date, default: null },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
}, { timestamps: true });
seoCollectionSchema.index({ status: 1, is_deleted: 1 });
seoCollectionSchema.index({ collection_type: 1, is_deleted: 1 });
seoCollectionSchema.index({ seo_index_status: 1, is_deleted: 1 });
seoCollectionSchema.index({ health_score: 1 });
seoCollectionSchema.index({ priority_score: -1 });
seoCollectionSchema.index({ fuel_type_ids: 1 });
seoCollectionSchema.index({ body_type_ids: 1 });
exports.SeoCollection = (0, mongoose_1.model)('SeoCollection', seoCollectionSchema, 'seo_collection_pages');
//# sourceMappingURL=seo-collection.model.js.map