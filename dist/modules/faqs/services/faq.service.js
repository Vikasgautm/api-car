"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQService = void 0;
const faq_model_1 = require("../../../models/faq.model");
const uuid_1 = require("uuid");
class FAQService {
    static async getAllFAQs(query) {
        const { category, car_id, page = 1, limit = 10 } = query;
        const filter = { is_deleted: false, is_published: true };
        if (category)
            filter.category = category;
        if (car_id)
            filter.car_id = car_id;
        const skip = (page - 1) * limit;
        const faqs = await faq_model_1.FAQ.find(filter).skip(skip).limit(Number(limit));
        const total = await faq_model_1.FAQ.countDocuments(filter);
        return { faqs, total, page, limit };
    }
    static async createFAQ(faqData) {
        const faq_id = (0, uuid_1.v4)();
        return await faq_model_1.FAQ.create({
            ...faqData,
            faq_id,
        });
    }
}
exports.FAQService = FAQService;
//# sourceMappingURL=faq.service.js.map