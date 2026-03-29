"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQ = void 0;
const mongoose_1 = require("mongoose");
const faqSchema = new mongoose_1.Schema({
    faq_id: { type: String, required: true, unique: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String },
    related_blog: { type: String, ref: 'Blog' },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    car_id: { type: String, ref: 'Car' },
}, { timestamps: true });
exports.FAQ = (0, mongoose_1.model)('FAQ', faqSchema);
//# sourceMappingURL=faq.model.js.map