import { Request, Response } from 'express';
import { AppError } from '../../../shared/utils/app-error.util';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { CreateFaqDto } from '../dto/create-faq.dto';
import { UpdateFaqDto } from '../dto/update-faq.dto';
import { FAQService } from '../services/faq.service';
import { FAQOrchestratorService } from '../services/faq-orchestrator.service';
import { FAQTemplateEngineService } from '../services/faq-template-engine.service';
import { FAQDeduplicationService } from '../services/faq-deduplication.service';
import { FAQAIDraftService } from '../services/faq-ai-draft.service';
import { FAQHealthService } from '../services/faq-health.service';
import { FAQPageType } from '../../../models/faq.model';

export class FAQController {
  // ---- Public routes ----

  static getAllPublicFAQs = catchAsync(async (req: Request, res: Response) => {
    const result = await FAQService.getAllFAQs({ ...req.query, is_published: true }, false);
    return ResponseUtil.paginated(res, result.faqs, result.pagination, 'FAQs retrieved successfully');
  });

  static getPublicFAQById = catchAsync(async (req: Request, res: Response) => {
    const faq = await FAQService.getFAQById(req.params.id as string);
    if (!faq) throw new AppError('FAQ not found', 404);
    return ResponseUtil.success(res, faq, 'FAQ retrieved successfully');
  });

  static getFAQsByGroup = catchAsync(async (req: Request, res: Response) => {
    const faqs = await FAQService.getFAQsByGroup(req.params.groupName as string);
    return ResponseUtil.success(res, faqs, 'FAQs retrieved successfully');
  });

  static getFeaturedFAQs = catchAsync(async (req: Request, res: Response) => {
    const faqs = await FAQService.getFeaturedFAQs();
    return ResponseUtil.success(res, faqs, 'Featured FAQs retrieved successfully');
  });

  static getFAQsByTag = catchAsync(async (req: Request, res: Response) => {
    const faqs = await FAQService.getFAQsByTag(req.params.tag as string);
    return ResponseUtil.success(res, faqs, 'FAQs retrieved successfully');
  });

  static incrementViewCount = catchAsync(async (req: Request, res: Response) => {
    const faq = await FAQService.incrementViewCount(req.params.id as string);
    return ResponseUtil.success(res, faq, 'View count incremented');
  });

  static incrementClickCount = catchAsync(async (req: Request, res: Response) => {
    const faq = await FAQService.incrementClickCount(req.params.id as string);
    return ResponseUtil.success(res, faq, 'Click count incremented');
  });

  // ---- Orchestration (public-facing) ----

  static getContextualFAQs = catchAsync(async (req: Request, res: Response) => {
    const { page_type, entity_type, entity_id } = req.query as Record<string, string>;

    if (!page_type) throw new AppError('page_type is required', 400);

    const result = await FAQOrchestratorService.getContextualFAQs(
      page_type as FAQPageType,
      entity_type,
      entity_id,
    );
    return ResponseUtil.success(res, result, 'Contextual FAQs retrieved');
  });

  // ---- Admin routes ----

  static getAllAdminFAQs = catchAsync(async (req: Request, res: Response) => {
    const includeDeleted = req.query.include_deleted === 'true';
    const result = await FAQService.getAllFAQs(req.query, includeDeleted);
    return ResponseUtil.paginated(res, result.faqs, result.pagination, 'FAQs retrieved successfully');
  });

  static getAdminFAQById = catchAsync(async (req: Request, res: Response) => {
    const faq = await FAQService.getFAQById(req.params.id as string);
    if (!faq) throw new AppError('FAQ not found', 404);
    return ResponseUtil.success(res, faq, 'FAQ retrieved successfully');
  });

  static createFAQ = catchAsync(async (req: Request, res: Response) => {
    const createDto: CreateFaqDto = {
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

    const validation = CreateFaqDto.validate(createDto);
    if (!validation.valid) throw new AppError(validation.errors.join(', '), 400);

    const faq = await FAQService.createFAQ(createDto);
    return ResponseUtil.created(res, faq, 'FAQ created successfully');
  });

  static updateFAQ = catchAsync(async (req: Request, res: Response) => {
    const updateDto: UpdateFaqDto = {
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
      is_published:
        req.body.is_published !== undefined
          ? req.body.is_published === 'true' || req.body.is_published === true
          : undefined,
      is_featured:
        req.body.is_featured !== undefined
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

    const validation = UpdateFaqDto.validate(updateDto);
    if (!validation.valid) throw new AppError(validation.errors.join(', '), 400);

    const faq = await FAQService.updateFAQ(req.params.id as string, updateDto);
    return ResponseUtil.success(res, faq, 'FAQ updated successfully');
  });

  static deleteFAQ = catchAsync(async (req: Request, res: Response) => {
    const faq = await FAQService.deleteFAQ(req.params.id as string);
    return ResponseUtil.success(res, faq, 'FAQ deleted successfully');
  });

  static restoreFAQ = catchAsync(async (req: Request, res: Response) => {
    const faq = await FAQService.restoreFAQ(req.params.id as string);
    return ResponseUtil.success(res, faq, 'FAQ restored successfully');
  });

  static togglePublish = catchAsync(async (req: Request, res: Response) => {
    const faq = await FAQService.togglePublish(req.params.id as string);
    return ResponseUtil.success(res, faq, 'FAQ publish status toggled');
  });

  static markReviewed = catchAsync(async (req: Request, res: Response) => {
    const faq = await FAQService.markReviewed(req.params.id as string);
    return ResponseUtil.success(res, faq, 'FAQ marked as reviewed');
  });

  // ---- Health scoring ----

  static checkFaqHealth = catchAsync(async (req: Request, res: Response) => {
    const result = await FAQHealthService.checkFaq(req.params.id as string);
    return ResponseUtil.success(res, result, 'FAQ health recomputed');
  });

  static runBulkHealthCheck = catchAsync(async (req: Request, res: Response) => {
    const limit = req.body?.limit ? Number(req.body.limit) : undefined;
    const result = await FAQHealthService.runBulkHealthCheck(limit);
    return ResponseUtil.success(res, result, 'FAQ health recomputed in bulk');
  });

  // ---- AI drafting ----

  static draftFAQ = catchAsync(async (req: Request, res: Response) => {
    const { entity_type, entity_id, topic, existing_question } = req.body as {
      entity_type?: string;
      entity_id?: string;
      topic?: string;
      existing_question?: string;
    };
    const draft = await FAQAIDraftService.draftFAQ({ entity_type, entity_id, topic, existing_question });
    return ResponseUtil.success(res, draft, 'FAQ draft generated');
  });

  // ---- Templates ----

  static getTemplates = catchAsync(async (_req: Request, res: Response) => {
    const templates = FAQTemplateEngineService.getAllTemplates();
    return ResponseUtil.success(res, templates, 'FAQ templates retrieved');
  });

  static getTemplatesForPage = catchAsync(async (req: Request, res: Response) => {
    const templates = FAQTemplateEngineService.getTemplatesForPage(req.params.page_type as string);
    return ResponseUtil.success(res, templates, 'Templates for page type retrieved');
  });

  static getTemplatesForEntity = catchAsync(async (req: Request, res: Response) => {
    const templates = FAQTemplateEngineService.getTemplatesForEntity(req.params.entity_type as string);
    return ResponseUtil.success(res, templates, 'Templates for entity type retrieved');
  });

  // ---- Duplicate check ----

  static checkDuplicate = catchAsync(async (req: Request, res: Response) => {
    const { question, exclude_id } = req.body as { question: string; exclude_id?: string };
    if (!question) throw new AppError('question is required', 400);
    const result = await FAQService.checkDuplicate(question, exclude_id);
    return ResponseUtil.success(res, result, 'Duplicate check complete');
  });

  // ---- Bulk operations ----

  static bulkPublish = catchAsync(async (req: Request, res: Response) => {
    const { faq_ids } = req.body as { faq_ids: string[] };
    if (!Array.isArray(faq_ids) || faq_ids.length === 0) throw new AppError('faq_ids array required', 400);
    const result = await FAQService.bulkPublish(faq_ids);
    return ResponseUtil.success(res, result, `${result.modified} FAQs published`);
  });

  static bulkArchive = catchAsync(async (req: Request, res: Response) => {
    const { faq_ids } = req.body as { faq_ids: string[] };
    if (!Array.isArray(faq_ids) || faq_ids.length === 0) throw new AppError('faq_ids array required', 400);
    const result = await FAQService.bulkArchive(faq_ids);
    return ResponseUtil.success(res, result, `${result.modified} FAQs archived`);
  });

  static bulkEntityAttach = catchAsync(async (req: Request, res: Response) => {
    const { faq_ids, entity_type, entity_id } = req.body as { faq_ids: string[]; entity_type: string; entity_id: string };
    if (!Array.isArray(faq_ids) || !entity_type || !entity_id) throw new AppError('faq_ids, entity_type, entity_id required', 400);
    const result = await FAQService.bulkEntityAttach(faq_ids, entity_type, entity_id);
    return ResponseUtil.success(res, result, `${result.modified} FAQs attached to entity`);
  });

  static bulkVisibilityUpdate = catchAsync(async (req: Request, res: Response) => {
    const { faq_ids, visibility_status } = req.body as { faq_ids: string[]; visibility_status: string };
    if (!Array.isArray(faq_ids) || !visibility_status) throw new AppError('faq_ids and visibility_status required', 400);
    const result = await FAQService.bulkVisibilityUpdate(faq_ids, visibility_status);
    return ResponseUtil.success(res, result, `${result.modified} FAQs visibility updated`);
  });

  static bulkSchemaEnable = catchAsync(async (req: Request, res: Response) => {
    const { faq_ids, schema_enabled } = req.body as { faq_ids: string[]; schema_enabled: boolean };
    if (!Array.isArray(faq_ids) || schema_enabled === undefined) throw new AppError('faq_ids and schema_enabled required', 400);
    const result = await FAQService.bulkSchemaEnable(faq_ids, schema_enabled);
    return ResponseUtil.success(res, result, `${result.modified} FAQs schema updated`);
  });

  static bulkIntentUpdate = catchAsync(async (req: Request, res: Response) => {
    const { faq_ids, intent_type } = req.body as { faq_ids: string[]; intent_type: string };
    if (!Array.isArray(faq_ids) || !intent_type) throw new AppError('faq_ids and intent_type required', 400);
    const result = await FAQService.bulkIntentUpdate(faq_ids, intent_type);
    return ResponseUtil.success(res, result, `${result.modified} FAQs intent updated`);
  });

  static bulkRetag = catchAsync(async (req: Request, res: Response) => {
    const { faq_ids, tags } = req.body as { faq_ids: string[]; tags: string[] };
    if (!Array.isArray(faq_ids) || !Array.isArray(tags)) throw new AppError('faq_ids and tags arrays required', 400);
    const result = await FAQService.bulkRetag(faq_ids, tags);
    return ResponseUtil.success(res, result, `${result.modified} FAQs retagged`);
  });

  // ---- Duplicates report ----

  static getDuplicatesReport = catchAsync(async (_req: Request, res: Response) => {
    const groups = await FAQDeduplicationService.findAllDuplicates();
    return ResponseUtil.success(res, { groups, total_groups: groups.length }, 'Duplicate FAQ groups found');
  });
}
