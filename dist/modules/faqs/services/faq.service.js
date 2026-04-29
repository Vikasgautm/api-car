"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQService = void 0;
const uuid_1 = require("uuid");
const faq_model_1 = require("../../../models/faq.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const filter_util_1 = require("../../../shared/utils/filter.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const slug_util_1 = require("../../../shared/utils/slug.util");
class FAQService {
    static async getAllFAQs(filterDto, includeDeleted = false) {
        const { page = 1, limit = 10, category, car_id, tag, faq_group, is_published, is_featured, sortBy = 'order', sortOrder = 'asc', q, } = filterDto;
        const filter = {};
        if (!includeDeleted) {
            filter.is_deleted = false;
        }
        if (is_published !== undefined) {
            filter.is_published = is_published;
        }
        if (is_featured !== undefined) {
            filter.is_featured = is_featured;
        }
        if (category !== undefined) {
            filter.category = category;
        }
        if (tag !== undefined) {
            filter.tags = { $in: [tag] };
        }
        if (faq_group !== undefined) {
            filter.faq_group = faq_group;
        }
        if (car_id !== undefined) {
            filter.related_cars = { $in: [car_id] };
        }
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const sortFilter = filter_util_1.FilterUtil.buildSortFilter(sortBy, sortOrder);
        let query = faq_model_1.FAQ.find(filter);
        if (q && typeof q === 'string' && q.trim()) {
            query = faq_model_1.FAQ.find({
                $and: [
                    filter,
                    {
                        $or: [
                            { question: { $regex: q.trim(), $options: 'i' } },
                            { answer: { $regex: q.trim(), $options: 'i' } },
                        ],
                    },
                ],
            });
        }
        const faqs = await query
            .sort(sortFilter)
            .skip(skip)
            .limit(validatedLimit);
        const total = await faq_model_1.FAQ.countDocuments(filter);
        const paginationMeta = pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total);
        return { faqs, pagination: paginationMeta };
    }
    static async getFAQById(faqId) {
        return await faq_model_1.FAQ.findOne({ faq_id: faqId, is_deleted: false });
    }
    static async getFAQsByGroup(groupName) {
        return await faq_model_1.FAQ.find({ faq_group: groupName, is_published: true, is_deleted: false })
            .sort({ order: 1 });
    }
    static async getFeaturedFAQs() {
        return await faq_model_1.FAQ.find({ is_featured: true, is_published: true, is_deleted: false })
            .sort({ order: 1, view_count: -1 })
            .limit(10);
    }
    static async getFAQsByTag(tag) {
        return await faq_model_1.FAQ.find({ tags: tag, is_published: true, is_deleted: false })
            .sort({ view_count: -1 });
    }
    static async incrementViewCount(faqId) {
        const faq = await faq_model_1.FAQ.findOneAndUpdate({ faq_id: faqId, is_deleted: false }, { $inc: { view_count: 1 } }, { returnDocument: 'after' });
        if (!faq) {
            throw new app_error_util_1.AppError('FAQ not found', 404);
        }
        return faq;
    }
    static async togglePublish(faqId) {
        const faq = await faq_model_1.FAQ.findOne({ faq_id: faqId, is_deleted: false });
        if (!faq) {
            throw new app_error_util_1.AppError('FAQ not found', 404);
        }
        faq.is_published = !faq.is_published;
        await faq.save();
        return faq;
    }
    static async createFAQ(faqData) {
        const faq_id = (0, uuid_1.v4)();
        const slug = slug_util_1.SlugUtil.generate(faqData.question);
        const existingSlug = await faq_model_1.FAQ.findOne({ slug, is_deleted: false });
        if (existingSlug) {
            const existingSlugs = (await faq_model_1.FAQ.find({ is_deleted: false }).select('slug')).map(f => f.slug);
            const uniqueSlug = slug_util_1.SlugUtil.generateUnique(faqData.question, existingSlugs);
            faqData.slug = uniqueSlug;
        }
        else {
            faqData.slug = slug;
        }
        const faq = {
            faq_id,
            question: faqData.question,
            answer: faqData.answer,
            category: faqData.category,
            order: faqData.order || 0,
            tags: faqData.tags || [],
            answer_format: faqData.answer_format || 'text',
            faq_group: faqData.faq_group,
            related_cars: faqData.related_cars,
            related_brands: faqData.related_brands,
            related_blogs: faqData.related_blogs,
            is_published: faqData.is_published || false,
            is_featured: faqData.is_featured || false,
            is_deleted: false,
            slug: faqData.slug,
            view_count: 0,
        };
        return await faq_model_1.FAQ.create(faq);
    }
    static async updateFAQ(faqId, faqData) {
        const updateData = {};
        if (faqData.question !== undefined) {
            updateData.question = faqData.question;
            const newSlug = slug_util_1.SlugUtil.generate(faqData.question);
            const existingSlug = await faq_model_1.FAQ.findOne({ slug: newSlug, faq_id: { $ne: faqId }, is_deleted: false });
            if (!existingSlug) {
                updateData.slug = newSlug;
            }
        }
        if (faqData.answer !== undefined)
            updateData.answer = faqData.answer;
        if (faqData.category !== undefined)
            updateData.category = faqData.category;
        if (faqData.order !== undefined)
            updateData.order = faqData.order;
        if (faqData.tags !== undefined)
            updateData.tags = faqData.tags;
        if (faqData.answer_format !== undefined)
            updateData.answer_format = faqData.answer_format;
        if (faqData.faq_group !== undefined)
            updateData.faq_group = faqData.faq_group;
        if (faqData.related_cars !== undefined)
            updateData.related_cars = faqData.related_cars;
        if (faqData.related_brands !== undefined)
            updateData.related_brands = faqData.related_brands;
        if (faqData.related_blogs !== undefined)
            updateData.related_blogs = faqData.related_blogs;
        if (faqData.is_published !== undefined)
            updateData.is_published = faqData.is_published;
        if (faqData.is_featured !== undefined)
            updateData.is_featured = faqData.is_featured;
        const faq = await faq_model_1.FAQ.findOneAndUpdate({ faq_id: faqId, is_deleted: false }, updateData, { returnDocument: 'after' });
        if (!faq) {
            throw new app_error_util_1.AppError('FAQ not found', 404);
        }
        return faq;
    }
    static async deleteFAQ(faqId) {
        const faq = await faq_model_1.FAQ.findOneAndUpdate({ faq_id: faqId, is_deleted: false }, { is_deleted: true }, { returnDocument: 'after' });
        if (!faq) {
            throw new app_error_util_1.AppError('FAQ not found', 404);
        }
        return faq;
    }
    static async restoreFAQ(faqId) {
        const faq = await faq_model_1.FAQ.findOneAndUpdate({ faq_id: faqId, is_deleted: true }, { is_deleted: false }, { returnDocument: 'after' });
        if (!faq) {
            throw new app_error_util_1.AppError('FAQ not found', 404);
        }
        return faq;
    }
}
exports.FAQService = FAQService;
//# sourceMappingURL=faq.service.js.map