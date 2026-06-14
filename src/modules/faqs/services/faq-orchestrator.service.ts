import { FAQ, FAQPageType } from '../../../models/faq.model';
import { FAQPageContextService, PageContext } from './faq-page-context.service';
import { FAQTemplateEngineService, GeneratedFAQ } from './faq-template-engine.service';
import { FAQRelevanceService } from './faq-relevance.service';
import { FAQDeduplicationService } from './faq-deduplication.service';

export interface OrchestratedFAQ {
  question: string;
  answer: string;
  faq_type: string;
  intent_type?: string;
  entity_type?: string;
  entity_id?: string;
  template_key?: string;
  faq_id?: string;
  is_dynamic: boolean;
  is_editorial: boolean;
  schema_enabled: boolean;
  indexable: boolean;
  source_type: string;
}

export interface OrchestratorResult {
  faqs: OrchestratedFAQ[];
  total: number;
  page_type: string;
  entity_type?: string;
  entity_id?: string;
  entity_name?: string;
  schema_faqs: Array<{ question: string; answer: string }>;
}

// In-memory cache per page+entity (5 min TTL)
const cache = new Map<string, { result: OrchestratorResult; at: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function cacheKey(pageType: string, entityType?: string, entityId?: string): string {
  return `${pageType}:${entityType ?? '_'}:${entityId ?? '_'}`;
}

export class FAQOrchestratorService {
  static async getContextualFAQs(
    pageType: FAQPageType,
    entityType?: string,
    entityId?: string,
  ): Promise<OrchestratorResult> {
    const key = cacheKey(pageType, entityType, entityId);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.at < CACHE_TTL) {
      return cached.result;
    }

    const context = await FAQPageContextService.resolvePageContext(pageType, entityType, entityId);
    const result = await FAQOrchestratorService.buildFAQs(context);

    cache.set(key, { result, at: Date.now() });
    return result;
  }

  static invalidateCache(pageType?: string, entityType?: string, entityId?: string): void {
    if (!pageType) {
      cache.clear();
      return;
    }
    const key = cacheKey(pageType, entityType, entityId);
    cache.delete(key);
  }

  private static async buildFAQs(context: PageContext): Promise<OrchestratorResult> {
    const [editorialFAQs, dynamicFAQs] = await Promise.allSettled([
      FAQOrchestratorService.fetchEditorialFAQs(context),
      FAQOrchestratorService.generateDynamicFAQs(context),
    ]);

    const editorial =
      editorialFAQs.status === 'fulfilled' ? editorialFAQs.value : [];
    const dynamic =
      dynamicFAQs.status === 'fulfilled' ? dynamicFAQs.value : [];

    // Convert editorial DB FAQs to orchestrated format
    const editorialOrchestrated: OrchestratedFAQ[] = editorial.map((faq: any) => ({
      question: faq.question,
      answer: faq.answer,
      faq_type: faq.faq_type ?? 'editorial',
      intent_type: faq.intent_type,
      entity_type: faq.entity_type,
      entity_id: faq.entity_id,
      template_key: faq.template_key,
      faq_id: faq.faq_id,
      is_dynamic: false,
      is_editorial: true,
      schema_enabled: faq.schema_enabled ?? true,
      indexable: faq.indexable ?? true,
      source_type: faq.source_type ?? 'manual',
    }));

    // Convert generated template FAQs to orchestrated format
    const dynamicOrchestrated: OrchestratedFAQ[] = dynamic.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
      faq_type: faq.faq_type,
      intent_type: faq.intent_type,
      entity_type: faq.entity_type,
      entity_id: faq.entity_id,
      template_key: faq.template_key,
      is_dynamic: true,
      is_editorial: false,
      schema_enabled: faq.schema_enabled,
      indexable: faq.indexable,
      source_type: 'template',
    }));

    // Editorial FAQs take precedence; dynamic fills remaining slots
    const combined = [...editorialOrchestrated, ...dynamicOrchestrated];

    // Rank by relevance
    const ranked = FAQRelevanceService.rankFAQs(combined as any, {
      page_type: context.page_type,
      entity_type: context.entity_type,
      entity_id: context.entity_id,
      applicable_faq_types: context.applicable_faq_types,
    }) as OrchestratedFAQ[];

    // Deduplicate
    const deduped = FAQDeduplicationService.deduplicateFAQs(ranked);

    // Apply page limit
    const limited = deduped.slice(0, context.faq_limit);

    // Build schema-ready FAQs (only schema_enabled + indexable ones)
    const schemaFaqs = limited
      .filter((f) => f.schema_enabled && f.indexable)
      .map((f) => ({ question: f.question, answer: f.answer.replace(/<[^>]*>/g, '') }));

    return {
      faqs: limited,
      total: limited.length,
      page_type: context.page_type,
      entity_type: context.entity_type,
      entity_id: context.entity_id,
      entity_name: context.entity_name,
      schema_faqs: schemaFaqs,
    };
  }

  private static async fetchEditorialFAQs(context: PageContext): Promise<any[]> {
    const baseFilter: Record<string, any> = {
      is_deleted: false,
      is_published: true,
      visibility_status: { $ne: 'hidden' },
      faq_type: { $in: context.applicable_faq_types },
    };

    const filters: any[] = [baseFilter];

    // Entity-specific filter. Match an FAQ to the page's entity through ANY of the
    // ways it can be linked: the primary entity_id, the generic related_entities[]
    // array (covers brand / car / blog / body_type / fuel_type / variant), or the
    // legacy per-type arrays. This is what lets a body_type / blog / brand page show
    // every FAQ that references its id.
    if (context.entity_id) {
      filters.push({
        is_deleted: false,
        is_published: true,
        visibility_status: { $ne: 'hidden' },
        $or: [
          { entity_id: context.entity_id },
          { 'related_entities.entity_id': context.entity_id },
          { related_cars: context.entity_id },
          { related_brands: context.entity_id },
          { related_blogs: context.entity_id },
        ],
      });
    }

    // Page-targeted filter
    const pageFilter: Record<string, any> = {
      is_deleted: false,
      is_published: true,
      visibility_status: { $ne: 'hidden' },
      target_page_types: context.page_type,
    };
    filters.push(pageFilter);

    const results = await Promise.allSettled(
      filters.map((f) =>
        FAQ.find(f)
          .sort({ priority_score: -1, order: 1 })
          .limit(context.faq_limit * 2)
          .lean()
      )
    );

    const seen = new Set<string>();
    const merged: any[] = [];

    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      for (const faq of r.value as any[]) {
        if (!seen.has(faq.faq_id)) {
          seen.add(faq.faq_id);
          merged.push(faq);
        }
      }
    }

    return merged;
  }

  private static async generateDynamicFAQs(context: PageContext): Promise<GeneratedFAQ[]> {
    if (!context.entity_id || !context.entity_type) return [];

    try {
      switch (context.entity_type) {
        case 'variant':
          return await FAQTemplateEngineService.generateVariantFAQs(context.entity_id);
        case 'car':
          return await FAQTemplateEngineService.generateCarFAQs(context.entity_id);
        case 'brand':
          return await FAQTemplateEngineService.generateBrandFAQs(context.entity_id);
        case 'fuel_type':
          return await FAQTemplateEngineService.generateFuelTypeFAQs(context.entity_id);
        case 'comparison':
          return await FAQTemplateEngineService.generateComparisonFAQs(
            context.entity_id.split('_vs_')
          );
        default:
          return [];
      }
    } catch {
      return [];
    }
  }
}
