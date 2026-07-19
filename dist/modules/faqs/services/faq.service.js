"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQService = void 0;
const uuid_1 = require("uuid");
const faq_model_1 = require("../../../models/faq.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const filter_util_1 = require("../../../shared/utils/filter.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const slug_util_1 = require("../../../shared/utils/slug.util");
const faq_deduplication_service_1 = require("./faq-deduplication.service");
const faq_orchestrator_service_1 = require("./faq-orchestrator.service");
class FAQService {
    static async getAllFAQs(filterDto, includeDeleted = false) {
        const { page = 1, limit = 10, category, car_id, tag, faq_group, is_published, is_featured, is_deleted, faq_type, entity_type, entity_id, visibility_status, source_type, schema_enabled, needs_refresh, health_below, stale_before, review_queue, sortBy = 'order', sortOrder = 'asc', q, } = filterDto;
        const filter = {};
        if (is_deleted === 'true' || is_deleted === true) {
            filter.is_deleted = true;
        }
        else if (!includeDeleted) {
            filter.is_deleted = false;
        }
        if (is_published !== undefined)
            filter.is_published = is_published;
        if (is_featured !== undefined)
            filter.is_featured = is_featured;
        if (category !== undefined)
            filter.category = category;
        if (tag !== undefined)
            filter.tags = { $in: [tag] };
        if (faq_group !== undefined)
            filter.faq_group = faq_group;
        if (car_id !== undefined)
            filter.related_cars = { $in: [car_id] };
        if (faq_type !== undefined)
            filter.faq_type = faq_type;
        if (entity_type !== undefined)
            filter.entity_type = entity_type;
        if (entity_id !== undefined)
            filter.entity_id = entity_id;
        if (visibility_status !== undefined)
            filter.visibility_status = visibility_status;
        if (source_type !== undefined)
            filter.source_type = source_type;
        if (schema_enabled !== undefined)
            filter.schema_enabled = schema_enabled === 'true' || schema_enabled === true;
        if (needs_refresh !== undefined)
            filter.needs_refresh = needs_refresh === 'true' || needs_refresh === true;
        if (health_below !== undefined && health_below !== '') {
            const threshold = Number(health_below);
            if (!Number.isNaN(threshold))
                filter.faq_health_score = { $lt: threshold };
        }
        if (stale_before !== undefined && stale_before !== '') {
            const staleDate = new Date(stale_before);
            if (!Number.isNaN(staleDate.getTime())) {
                filter.$or = [
                    { last_reviewed_at: { $lt: staleDate } },
                    { last_reviewed_at: { $exists: false } },
                    { last_reviewed_at: null },
                ];
            }
        }
        // Review-queue convenience filter: surface FAQs needing attention via OR of
        // (flagged for refresh) | (low health) | (never/long-ago reviewed).
        if (review_queue === 'true' || review_queue === true) {
            const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            filter.$or = [
                { needs_refresh: true },
                { faq_health_score: { $lt: 70 } },
                { last_reviewed_at: { $lt: ninetyDaysAgo } },
                { last_reviewed_at: { $exists: false } },
                { last_reviewed_at: null },
            ];
        }
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const sortFilter = filter_util_1.FilterUtil.buildSortFilter(sortBy, sortOrder);
        // Build the final filter once so the list query and the count stay in sync —
        // otherwise a search term narrows the results but not the reported total.
        const finalFilter = q && typeof q === 'string' && q.trim()
            ? {
                $and: [
                    filter,
                    {
                        $or: [
                            { question: { $regex: q.trim(), $options: 'i' } },
                            { answer: { $regex: q.trim(), $options: 'i' } },
                        ],
                    },
                ],
            }
            : filter;
        const faqs = await faq_model_1.FAQ.find(finalFilter).sort(sortFilter).skip(skip).limit(validatedLimit);
        const total = await faq_model_1.FAQ.countDocuments(finalFilter);
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
        if (!faq)
            throw new app_error_util_1.AppError('FAQ not found', 404);
        return faq;
    }
    static async incrementClickCount(faqId) {
        const faq = await faq_model_1.FAQ.findOneAndUpdate({ faq_id: faqId, is_deleted: false }, { $inc: { click_count: 1 } }, { returnDocument: 'after' });
        if (!faq)
            throw new app_error_util_1.AppError('FAQ not found', 404);
        return faq;
    }
    static async togglePublish(faqId) {
        const faq = await faq_model_1.FAQ.findOne({ faq_id: faqId, is_deleted: false });
        if (!faq)
            throw new app_error_util_1.AppError('FAQ not found', 404);
        faq.is_published = !faq.is_published;
        await faq.save();
        faq_orchestrator_service_1.FAQOrchestratorService.invalidateCache();
        return faq;
    }
    static async markReviewed(faqId) {
        const faq = await faq_model_1.FAQ.findOne({ faq_id: faqId, is_deleted: false });
        if (!faq)
            throw new app_error_util_1.AppError('FAQ not found', 404);
        faq.last_reviewed_at = new Date();
        faq.needs_refresh = false;
        faq.freshness_score = 100;
        await faq.save();
        faq_orchestrator_service_1.FAQOrchestratorService.invalidateCache();
        return faq;
    }
    static async createFAQ(faqData) {
        const faq_id = (0, uuid_1.v4)();
        const normalizedQuestion = faq_deduplication_service_1.FAQDeduplicationService.normalizeQuestion(faqData.question);
        const slug = slug_util_1.SlugUtil.generate(faqData.question);
        const existingSlug = await faq_model_1.FAQ.findOne({ slug, is_deleted: false });
        if (existingSlug) {
            const pattern = new RegExp(`^${slug}(-\\d+)?$`);
            const matchingSlugs = (await faq_model_1.FAQ.find({ slug: pattern, is_deleted: false }).select('slug').lean()).map((f) => f.slug);
            faqData.slug = slug_util_1.SlugUtil.generateUnique(faqData.question, matchingSlugs);
        }
        else {
            faqData.slug = slug;
        }
        const faq = {
            faq_id,
            question: faqData.question,
            answer: faqData.answer,
            category: faqData.category,
            order: faqData.order ?? 0,
            tags: faqData.tags ?? [],
            answer_format: faqData.answer_format ?? 'text',
            faq_group: faqData.faq_group,
            related_cars: faqData.related_cars,
            related_brands: faqData.related_brands,
            related_blogs: faqData.related_blogs,
            is_published: faqData.is_published ?? false,
            is_featured: faqData.is_featured ?? false,
            is_deleted: false,
            slug: faqData.slug,
            view_count: 0,
            click_count: 0,
            // Intelligence fields
            faq_type: faqData.faq_type ?? 'editorial',
            intent_type: faqData.intent_type,
            entity_type: faqData.entity_type,
            entity_id: faqData.entity_id,
            related_entities: faqData.related_entities ?? [],
            target_page_types: faqData.target_page_types ?? [],
            template_key: faqData.template_key,
            is_dynamic: faqData.is_dynamic ?? false,
            is_editorial: faqData.is_editorial ?? true,
            source_type: faqData.source_type ?? 'manual',
            canonical_intent_key: faqData.canonical_intent_key,
            normalized_question: normalizedQuestion,
            indexable: faqData.indexable ?? true,
            schema_enabled: faqData.schema_enabled ?? true,
            priority_score: faqData.priority_score ?? 50,
            freshness_score: 100,
            faq_health_score: 100,
            visibility_status: faqData.visibility_status ?? 'visible',
            needs_refresh: false,
        };
        const created = await faq_model_1.FAQ.create(faq);
        faq_orchestrator_service_1.FAQOrchestratorService.invalidateCache();
        return created;
    }
    static async updateFAQ(faqId, faqData) {
        const updateData = {};
        if (faqData.question !== undefined) {
            updateData.question = faqData.question;
            updateData.normalized_question = faq_deduplication_service_1.FAQDeduplicationService.normalizeQuestion(faqData.question);
            const newSlug = slug_util_1.SlugUtil.generate(faqData.question);
            const existingSlug = await faq_model_1.FAQ.findOne({ slug: newSlug, faq_id: { $ne: faqId }, is_deleted: false });
            if (!existingSlug)
                updateData.slug = newSlug;
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
        // Intelligence fields
        if (faqData.faq_type !== undefined)
            updateData.faq_type = faqData.faq_type;
        if (faqData.intent_type !== undefined)
            updateData.intent_type = faqData.intent_type;
        if (faqData.entity_type !== undefined)
            updateData.entity_type = faqData.entity_type;
        if (faqData.entity_id !== undefined)
            updateData.entity_id = faqData.entity_id;
        if (faqData.related_entities !== undefined)
            updateData.related_entities = faqData.related_entities;
        if (faqData.target_page_types !== undefined)
            updateData.target_page_types = faqData.target_page_types;
        if (faqData.template_key !== undefined)
            updateData.template_key = faqData.template_key;
        if (faqData.is_dynamic !== undefined)
            updateData.is_dynamic = faqData.is_dynamic;
        if (faqData.is_editorial !== undefined)
            updateData.is_editorial = faqData.is_editorial;
        // if (faqData.canonical_intent_key !== undefined) updateData.canonical_intent_key = faqData.canonical_intent_key;
        if (faqData.indexable !== undefined)
            updateData.indexable = faqData.indexable;
        if (faqData.schema_enabled !== undefined)
            updateData.schema_enabled = faqData.schema_enabled;
        if (faqData.priority_score !== undefined)
            updateData.priority_score = faqData.priority_score;
        if (faqData.visibility_status !== undefined)
            updateData.visibility_status = faqData.visibility_status;
        if (faqData.needs_refresh !== undefined)
            updateData.needs_refresh = faqData.needs_refresh;
        if (faqData.source_type !== undefined)
            updateData.source_type = faqData.source_type;
        const faq = await faq_model_1.FAQ.findOneAndUpdate({ faq_id: faqId, is_deleted: false }, updateData, { returnDocument: 'after' });
        if (!faq)
            throw new app_error_util_1.AppError('FAQ not found', 404);
        faq_orchestrator_service_1.FAQOrchestratorService.invalidateCache();
        return faq;
    }
    static async deleteFAQ(faqId) {
        const faq = await faq_model_1.FAQ.findOneAndUpdate({ faq_id: faqId, is_deleted: false }, { is_deleted: true }, { returnDocument: 'after' });
        if (!faq)
            throw new app_error_util_1.AppError('FAQ not found', 404);
        faq_orchestrator_service_1.FAQOrchestratorService.invalidateCache();
        return faq;
    }
    static async restoreFAQ(faqId) {
        const faq = await faq_model_1.FAQ.findOneAndUpdate({ faq_id: faqId, is_deleted: true }, { is_deleted: false }, { returnDocument: 'after' });
        if (!faq)
            throw new app_error_util_1.AppError('FAQ not found', 404);
        faq_orchestrator_service_1.FAQOrchestratorService.invalidateCache();
        return faq;
    }
    // ---- Bulk operations ----
    static async bulkPublish(faqIds) {
        const result = await faq_model_1.FAQ.updateMany({ faq_id: { $in: faqIds }, is_deleted: false }, { is_published: true });
        faq_orchestrator_service_1.FAQOrchestratorService.invalidateCache();
        return { modified: result.modifiedCount };
    }
    static async bulkArchive(faqIds) {
        const result = await faq_model_1.FAQ.updateMany({ faq_id: { $in: faqIds }, is_deleted: false }, { is_published: false, visibility_status: 'hidden' });
        faq_orchestrator_service_1.FAQOrchestratorService.invalidateCache();
        return { modified: result.modifiedCount };
    }
    static async bulkEntityAttach(faqIds, entityType, entityId) {
        const result = await faq_model_1.FAQ.updateMany({ faq_id: { $in: faqIds }, is_deleted: false }, { entity_type: entityType, entity_id: entityId });
        faq_orchestrator_service_1.FAQOrchestratorService.invalidateCache();
        return { modified: result.modifiedCount };
    }
    static async bulkVisibilityUpdate(faqIds, visibility_status) {
        const result = await faq_model_1.FAQ.updateMany({ faq_id: { $in: faqIds }, is_deleted: false }, { visibility_status });
        faq_orchestrator_service_1.FAQOrchestratorService.invalidateCache();
        return { modified: result.modifiedCount };
    }
    static async bulkSchemaEnable(faqIds, schema_enabled) {
        const result = await faq_model_1.FAQ.updateMany({ faq_id: { $in: faqIds }, is_deleted: false }, { schema_enabled });
        faq_orchestrator_service_1.FAQOrchestratorService.invalidateCache();
        return { modified: result.modifiedCount };
    }
    static async bulkIntentUpdate(faqIds, intent_type) {
        const result = await faq_model_1.FAQ.updateMany({ faq_id: { $in: faqIds }, is_deleted: false }, { intent_type });
        faq_orchestrator_service_1.FAQOrchestratorService.invalidateCache();
        return { modified: result.modifiedCount };
    }
    static async bulkRetag(faqIds, tags) {
        const result = await faq_model_1.FAQ.updateMany({ faq_id: { $in: faqIds }, is_deleted: false }, { tags });
        faq_orchestrator_service_1.FAQOrchestratorService.invalidateCache();
        return { modified: result.modifiedCount };
    }
    static async checkDuplicate(question, excludeId) {
        return faq_deduplication_service_1.FAQDeduplicationService.checkDuplicateInDB(question, excludeId);
    }
}
exports.FAQService = FAQService;
