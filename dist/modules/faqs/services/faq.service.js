"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQService = void 0;
const faq_model_1 = require("../../../models/faq.model");
const uuid_1 = require("uuid");
class FAQService {
    static async getAllFAQs(query, fetchAsAdmin = false) {
        const { category, car_id, page = 1, limit = 10, is_deleted } = query;
        const filter = { is_deleted: is_deleted === 'true' };
        if (!fetchAsAdmin && is_deleted !== 'true') {
            filter.is_published = true;
        }
        if (category)
            filter.category = category;
        if (car_id)
            filter.car_id = car_id;
        const skip = (Number(page) - 1) * Number(limit);
        const faqs = await faq_model_1.FAQ.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await faq_model_1.FAQ.countDocuments(filter);
        return { faqs, total, page: Number(page), limit: Number(limit) };
    }
    static async updateFAQ(id, faqData) {
        return await faq_model_1.FAQ.findOneAndUpdate({ faq_id: id }, faqData, { new: true });
    }
    static async deleteFAQ(id) {
        return await faq_model_1.FAQ.findOneAndUpdate({ faq_id: id }, { is_deleted: true }, { new: true });
    }
    static async restoreFAQ(id) {
        return await faq_model_1.FAQ.findOneAndUpdate({ faq_id: id }, { is_deleted: false }, { new: true });
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