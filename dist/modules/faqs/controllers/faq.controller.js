"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQController = void 0;
const validation_1 = require("../../../shared/validation");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const faq_service_1 = require("../services/faq.service");
const faq_orchestrator_service_1 = require("../services/faq-orchestrator.service");
const faq_template_engine_service_1 = require("../services/faq-template-engine.service");
const faq_deduplication_service_1 = require("../services/faq-deduplication.service");
const faq_ai_draft_service_1 = require("../services/faq-ai-draft.service");
const faq_health_service_1 = require("../services/faq-health.service");
class FAQController {
    // ---- Public routes ----
    static getAllPublicFAQs = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await faq_service_1.FAQService.getAllFAQs({ ...req.query, is_published: true }, false);
        return response_util_1.ResponseUtil.paginated(res, result.faqs, result.pagination, 'FAQs retrieved successfully');
    });
    static getPublicFAQById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faq = await faq_service_1.FAQService.getFAQById(req.params.id);
        if (!faq)
            throw new app_error_util_1.AppError('FAQ not found', 404);
        return response_util_1.ResponseUtil.success(res, faq, 'FAQ retrieved successfully');
    });
    static getFAQsByGroup = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faqs = await faq_service_1.FAQService.getFAQsByGroup(req.params.groupName);
        return response_util_1.ResponseUtil.success(res, faqs, 'FAQs retrieved successfully');
    });
    static getFeaturedFAQs = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faqs = await faq_service_1.FAQService.getFeaturedFAQs();
        return response_util_1.ResponseUtil.success(res, faqs, 'Featured FAQs retrieved successfully');
    });
    static getFAQsByTag = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faqs = await faq_service_1.FAQService.getFAQsByTag(req.params.tag);
        return response_util_1.ResponseUtil.success(res, faqs, 'FAQs retrieved successfully');
    });
    static incrementViewCount = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faq = await faq_service_1.FAQService.incrementViewCount(req.params.id);
        return response_util_1.ResponseUtil.success(res, faq, 'View count incremented');
    });
    static incrementClickCount = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faq = await faq_service_1.FAQService.incrementClickCount(req.params.id);
        return response_util_1.ResponseUtil.success(res, faq, 'Click count incremented');
    });
    // ---- Orchestration (public-facing) ----
    static getContextualFAQs = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { page_type, entity_type, entity_id } = req.query;
        if (!page_type)
            throw new app_error_util_1.AppError('page_type is required', 400);
        const result = await faq_orchestrator_service_1.FAQOrchestratorService.getContextualFAQs(page_type, entity_type, entity_id);
        return response_util_1.ResponseUtil.success(res, result, 'Contextual FAQs retrieved');
    });
    // ---- Admin routes ----
    static getAllAdminFAQs = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const includeDeleted = req.query.include_deleted === 'true';
        const result = await faq_service_1.FAQService.getAllFAQs(req.query, includeDeleted);
        return response_util_1.ResponseUtil.paginated(res, result.faqs, result.pagination, 'FAQs retrieved successfully');
    });
    static getAdminFAQById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faq = await faq_service_1.FAQService.getFAQById(req.params.id);
        if (!faq)
            throw new app_error_util_1.AppError('FAQ not found', 404);
        return response_util_1.ResponseUtil.success(res, faq, 'FAQ retrieved successfully');
    });
    static createFAQ = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const createDto = {
            question: req.body.question,
            answer: req.body.answer,
            category: req.body.category,
            order: req.body.order,
            tags: req.body.tags,
            answer_format: req.body.answer_format,
            faq_group: req.body.faq_group,
            related_cars: req.body.related_cars,
            related_brands: req.body.related_brands,
            related_blogs: req.body.related_blogs,
            is_published: req.body.is_published,
            is_featured: req.body.is_featured,
            faq_type: req.body.faq_type,
            intent_type: req.body.intent_type,
            entity_type: req.body.entity_type,
            entity_id: req.body.entity_id,
            related_entities: req.body.related_entities,
            target_page_types: req.body.target_page_types,
            template_key: req.body.template_key,
            is_dynamic: req.body.is_dynamic,
            is_editorial: req.body.is_editorial,
            canonical_intent_key: req.body.canonical_intent_key,
            indexable: req.body.indexable,
            schema_enabled: req.body.schema_enabled,
            priority_score: req.body.priority_score,
            visibility_status: req.body.visibility_status,
            source_type: req.body.source_type,
        };
        const validation = validation_1.createFaqSchema.safeParse(createDto);
        if (!validation.success)
            throw new app_error_util_1.AppError(validation.error.errors.map(e => e.message).join(', '), 400);
        const faq = await faq_service_1.FAQService.createFAQ(createDto);
        return response_util_1.ResponseUtil.created(res, faq, 'FAQ created successfully');
    });
    static updateFAQ = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const updateDto = {
            question: req.body.question,
            answer: req.body.answer,
            category: req.body.category,
            order: req.body.order,
            tags: req.body.tags,
            answer_format: req.body.answer_format,
            faq_group: req.body.faq_group,
            related_cars: req.body.related_cars,
            related_brands: req.body.related_brands,
            related_blogs: req.body.related_blogs,
            is_published: req.body.is_published !== undefined
                ? req.body.is_published === 'true' || req.body.is_published === true
                : undefined,
            is_featured: req.body.is_featured !== undefined
                ? req.body.is_featured === 'true' || req.body.is_featured === true
                : undefined,
            faq_type: req.body.faq_type,
            intent_type: req.body.intent_type,
            entity_type: req.body.entity_type,
            entity_id: req.body.entity_id,
            related_entities: req.body.related_entities,
            target_page_types: req.body.target_page_types,
            template_key: req.body.template_key,
            is_dynamic: req.body.is_dynamic,
            is_editorial: req.body.is_editorial,
            canonical_intent_key: req.body.canonical_intent_key,
            indexable: req.body.indexable,
            schema_enabled: req.body.schema_enabled,
            priority_score: req.body.priority_score,
            visibility_status: req.body.visibility_status,
            needs_refresh: req.body.needs_refresh,
            source_type: req.body.source_type,
        };
        const validation = validation_1.updateFaqSchema.safeParse(updateDto);
        if (!validation.success)
            throw new app_error_util_1.AppError(validation.error.errors.map(e => e.message).join(', '), 400);
        const faq = await faq_service_1.FAQService.updateFAQ(req.params.id, updateDto);
        return response_util_1.ResponseUtil.success(res, faq, 'FAQ updated successfully');
    });
    static deleteFAQ = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faq = await faq_service_1.FAQService.deleteFAQ(req.params.id);
        return response_util_1.ResponseUtil.success(res, faq, 'FAQ deleted successfully');
    });
    static restoreFAQ = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faq = await faq_service_1.FAQService.restoreFAQ(req.params.id);
        return response_util_1.ResponseUtil.success(res, faq, 'FAQ restored successfully');
    });
    static togglePublish = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faq = await faq_service_1.FAQService.togglePublish(req.params.id);
        return response_util_1.ResponseUtil.success(res, faq, 'FAQ publish status toggled');
    });
    static markReviewed = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const faq = await faq_service_1.FAQService.markReviewed(req.params.id);
        return response_util_1.ResponseUtil.success(res, faq, 'FAQ marked as reviewed');
    });
    // ---- Health scoring ----
    static checkFaqHealth = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await faq_health_service_1.FAQHealthService.checkFaq(req.params.id);
        return response_util_1.ResponseUtil.success(res, result, 'FAQ health recomputed');
    });
    static runBulkHealthCheck = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const limit = req.body?.limit ? Number(req.body.limit) : undefined;
        const result = await faq_health_service_1.FAQHealthService.runBulkHealthCheck(limit);
        return response_util_1.ResponseUtil.success(res, result, 'FAQ health recomputed in bulk');
    });
    // ---- AI drafting ----
    static draftFAQ = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { entity_type, entity_id, topic, existing_question } = req.body;
        const draft = await faq_ai_draft_service_1.FAQAIDraftService.draftFAQ({ entity_type, entity_id, topic, existing_question });
        return response_util_1.ResponseUtil.success(res, draft, 'FAQ draft generated');
    });
    // ---- Templates ----
    static getTemplates = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const templates = faq_template_engine_service_1.FAQTemplateEngineService.getAllTemplates();
        return response_util_1.ResponseUtil.success(res, templates, 'FAQ templates retrieved');
    });
    static getTemplatesForPage = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const templates = faq_template_engine_service_1.FAQTemplateEngineService.getTemplatesForPage(req.params.page_type);
        return response_util_1.ResponseUtil.success(res, templates, 'Templates for page type retrieved');
    });
    static getTemplatesForEntity = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const templates = faq_template_engine_service_1.FAQTemplateEngineService.getTemplatesForEntity(req.params.entity_type);
        return response_util_1.ResponseUtil.success(res, templates, 'Templates for entity type retrieved');
    });
    // ---- Duplicate check ----
    static checkDuplicate = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { question, exclude_id } = req.body;
        if (!question)
            throw new app_error_util_1.AppError('question is required', 400);
        const result = await faq_service_1.FAQService.checkDuplicate(question, exclude_id);
        return response_util_1.ResponseUtil.success(res, result, 'Duplicate check complete');
    });
    // ---- Bulk operations ----
    static bulkPublish = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { faq_ids } = req.body;
        if (!Array.isArray(faq_ids) || faq_ids.length === 0)
            throw new app_error_util_1.AppError('faq_ids array required', 400);
        const result = await faq_service_1.FAQService.bulkPublish(faq_ids);
        return response_util_1.ResponseUtil.success(res, result, `${result.modified} FAQs published`);
    });
    static bulkArchive = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { faq_ids } = req.body;
        if (!Array.isArray(faq_ids) || faq_ids.length === 0)
            throw new app_error_util_1.AppError('faq_ids array required', 400);
        const result = await faq_service_1.FAQService.bulkArchive(faq_ids);
        return response_util_1.ResponseUtil.success(res, result, `${result.modified} FAQs archived`);
    });
    static bulkEntityAttach = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { faq_ids, entity_type, entity_id } = req.body;
        if (!Array.isArray(faq_ids) || !entity_type || !entity_id)
            throw new app_error_util_1.AppError('faq_ids, entity_type, entity_id required', 400);
        const result = await faq_service_1.FAQService.bulkEntityAttach(faq_ids, entity_type, entity_id);
        return response_util_1.ResponseUtil.success(res, result, `${result.modified} FAQs attached to entity`);
    });
    static bulkVisibilityUpdate = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { faq_ids, visibility_status } = req.body;
        if (!Array.isArray(faq_ids) || !visibility_status)
            throw new app_error_util_1.AppError('faq_ids and visibility_status required', 400);
        const result = await faq_service_1.FAQService.bulkVisibilityUpdate(faq_ids, visibility_status);
        return response_util_1.ResponseUtil.success(res, result, `${result.modified} FAQs visibility updated`);
    });
    static bulkSchemaEnable = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { faq_ids, schema_enabled } = req.body;
        if (!Array.isArray(faq_ids) || schema_enabled === undefined)
            throw new app_error_util_1.AppError('faq_ids and schema_enabled required', 400);
        const result = await faq_service_1.FAQService.bulkSchemaEnable(faq_ids, schema_enabled);
        return response_util_1.ResponseUtil.success(res, result, `${result.modified} FAQs schema updated`);
    });
    static bulkIntentUpdate = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { faq_ids, intent_type } = req.body;
        if (!Array.isArray(faq_ids) || !intent_type)
            throw new app_error_util_1.AppError('faq_ids and intent_type required', 400);
        const result = await faq_service_1.FAQService.bulkIntentUpdate(faq_ids, intent_type);
        return response_util_1.ResponseUtil.success(res, result, `${result.modified} FAQs intent updated`);
    });
    static bulkRetag = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { faq_ids, tags } = req.body;
        if (!Array.isArray(faq_ids) || !Array.isArray(tags))
            throw new app_error_util_1.AppError('faq_ids and tags arrays required', 400);
        const result = await faq_service_1.FAQService.bulkRetag(faq_ids, tags);
        return response_util_1.ResponseUtil.success(res, result, `${result.modified} FAQs retagged`);
    });
    // ---- Duplicates report ----
    static getDuplicatesReport = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const groups = await faq_deduplication_service_1.FAQDeduplicationService.findAllDuplicates();
        return response_util_1.ResponseUtil.success(res, { groups, total_groups: groups.length }, 'Duplicate FAQ groups found');
    });
}
exports.FAQController = FAQController;
