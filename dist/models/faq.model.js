"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQ = void 0;
const mongoose_1 = require("mongoose");
const faqSchema = new mongoose_1.Schema({
    faq_id: { type: String, required: true, unique: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, required: true },
    order: { type: Number, default: 0 },
    tags: { type: [String] },
    answer_format: {
        type: String,
        enum: ['text', 'html', 'markdown'],
        default: 'text',
    },
    faq_group: { type: String },
    related_cars: [{ type: String }],
    related_brands: [{ type: String }],
    related_blogs: [{ type: String }],
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    slug: { type: String, required: true, unique: true },
    view_count: { type: Number, default: 0 },
    // Intelligence
    faq_type: {
        type: String,
        enum: ['editorial', 'specification', 'feature', 'performance', 'safety', 'dimensions', 'comparison', 'ownership', 'upcoming', 'collection', 'aggregation'],
        default: 'editorial',
    },
    intent_type: { type: String },
    // Entity mapping
    entity_type: {
        type: String,
        enum: ['car', 'variant', 'brand', 'body_type', 'fuel_type', 'comparison', 'seo_collection', 'global'],
    },
    entity_id: { type: String },
    related_entities: [
        {
            entity_type: { type: String },
            entity_id: { type: String },
            _id: false,
        },
    ],
    // Page targeting
    target_page_types: [{ type: String }],
    // Template support
    template_key: { type: String },
    is_dynamic: { type: Boolean, default: false },
    is_editorial: { type: Boolean, default: true },
    is_ai_generated: { type: Boolean, default: false },
    source_type: {
        type: String,
        enum: ['manual', 'template', 'ai', 'import'],
        default: 'manual',
    },
    // SEO / deduplication
    canonical_intent_key: { type: String },
    normalized_question: { type: String },
    indexable: { type: Boolean, default: true },
    schema_enabled: { type: Boolean, default: true },
    // Scoring
    priority_score: { type: Number, default: 50 },
    relevance_score: { type: Number, default: 0 },
    freshness_score: { type: Number, default: 100 },
    faq_health_score: { type: Number, default: 100 },
    // Status
    visibility_status: {
        type: String,
        enum: ['visible', 'hidden', 'scheduled'],
        default: 'visible',
    },
    needs_refresh: { type: Boolean, default: false },
    last_reviewed_at: { type: Date },
    // Analytics
    click_count: { type: Number, default: 0 },
}, {
    timestamps: true,
});
faqSchema.index({ category: 1 });
faqSchema.index({ tags: 1 });
faqSchema.index({ faq_group: 1 });
faqSchema.index({ is_published: 1, is_deleted: 1 });
faqSchema.index({ question: 'text', answer: 'text' });
faqSchema.index({ is_featured: 1 });
faqSchema.index({ order: 1 });
faqSchema.index({ view_count: -1 });
faqSchema.index({ is_published: 1, is_deleted: 1, is_featured: 1 });
faqSchema.index({ faq_group: 1, is_published: 1, is_deleted: 1, order: 1 });
// Intelligence indexes
faqSchema.index({ faq_type: 1 });
faqSchema.index({ entity_type: 1, entity_id: 1 });
faqSchema.index({ target_page_types: 1 });
faqSchema.index({ canonical_intent_key: 1 });
faqSchema.index({ priority_score: -1 });
faqSchema.index({ visibility_status: 1, is_published: 1, is_deleted: 1 });
faqSchema.index({ faq_type: 1, entity_type: 1, is_published: 1, is_deleted: 1 });
exports.FAQ = (0, mongoose_1.model)('FAQ', faqSchema);
//# sourceMappingURL=faq.model.js.map