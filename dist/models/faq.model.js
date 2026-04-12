"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQ = exports.AnswerFormat = exports.FAQCategory = void 0;
const mongoose_1 = require("mongoose");
var FAQCategory;
(function (FAQCategory) {
    FAQCategory["GENERAL"] = "General";
    FAQCategory["BUYING_GUIDE"] = "Buying Guide";
    FAQCategory["MAINTENANCE"] = "Maintenance";
    FAQCategory["COMPARISON"] = "Comparison";
    FAQCategory["FINANCING"] = "Financing";
    FAQCategory["DOCUMENTATION"] = "Documentation";
    FAQCategory["TECHNICAL"] = "Technical";
    FAQCategory["OTHER"] = "Other";
})(FAQCategory || (exports.FAQCategory = FAQCategory = {}));
var AnswerFormat;
(function (AnswerFormat) {
    AnswerFormat["TEXT"] = "text";
    AnswerFormat["HTML"] = "html";
    AnswerFormat["MARKDOWN"] = "markdown";
})(AnswerFormat || (exports.AnswerFormat = AnswerFormat = {}));
const faqSchema = new mongoose_1.Schema({
    faq_id: { type: String, required: true, unique: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: {
        type: String,
        required: true,
        enum: Object.values(FAQCategory),
        default: FAQCategory.GENERAL,
    },
    order: { type: Number, default: 0 },
    tags: [{ type: String }],
    answer_format: {
        type: String,
        enum: Object.values(AnswerFormat),
        default: AnswerFormat.TEXT,
    },
    view_count: { type: Number, default: 0 },
    faq_group: { type: String },
    related_cars: [{ type: String }],
    related_brands: [{ type: String }],
    related_blogs: [{ type: String }],
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    slug: { type: String, required: true, unique: true },
}, { timestamps: true });
faqSchema.index({ category: 1 });
faqSchema.index({ order: 1 });
faqSchema.index({ tags: 1 });
faqSchema.index({ faq_group: 1 });
faqSchema.index({ is_featured: 1 });
exports.FAQ = (0, mongoose_1.model)('FAQ', faqSchema);
//# sourceMappingURL=faq.model.js.map