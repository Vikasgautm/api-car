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
        default: 'text'
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
exports.FAQ = (0, mongoose_1.model)('FAQ', faqSchema);
//# sourceMappingURL=faq.model.js.map