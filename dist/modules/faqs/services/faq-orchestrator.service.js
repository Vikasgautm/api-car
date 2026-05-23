"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQOrchestratorService = void 0;
const faq_model_1 = require("../../../models/faq.model");
const faq_page_context_service_1 = require("./faq-page-context.service");
const faq_template_engine_service_1 = require("./faq-template-engine.service");
const faq_relevance_service_1 = require("./faq-relevance.service");
const faq_deduplication_service_1 = require("./faq-deduplication.service");
// In-memory cache per page+entity (5 min TTL)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
function cacheKey(pageType, entityType, entityId) {
    return `${pageType}:${entityType ?? '_'}:${entityId ?? '_'}`;
}
class FAQOrchestratorService {
    static async getContextualFAQs(pageType, entityType, entityId) {
        const key = cacheKey(pageType, entityType, entityId);
        const cached = cache.get(key);
        if (cached && Date.now() - cached.at < CACHE_TTL) {
            return cached.result;
        }
        const context = await faq_page_context_service_1.FAQPageContextService.resolvePageContext(pageType, entityType, entityId);
        const result = await FAQOrchestratorService.buildFAQs(context);
        cache.set(key, { result, at: Date.now() });
        return result;
    }
    static invalidateCache(pageType, entityType, entityId) {
        if (!pageType) {
            cache.clear();
            return;
        }
        const key = cacheKey(pageType, entityType, entityId);
        cache.delete(key);
    }
    static async buildFAQs(context) {
        const [editorialFAQs, dynamicFAQs] = await Promise.allSettled([
            FAQOrchestratorService.fetchEditorialFAQs(context),
            FAQOrchestratorService.generateDynamicFAQs(context),
        ]);
        const editorial = editorialFAQs.status === 'fulfilled' ? editorialFAQs.value : [];
        const dynamic = dynamicFAQs.status === 'fulfilled' ? dynamicFAQs.value : [];
        // Convert editorial DB FAQs to orchestrated format
        const editorialOrchestrated = editorial.map((faq) => ({
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
        const dynamicOrchestrated = dynamic.map((faq) => ({
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
        const ranked = faq_relevance_service_1.FAQRelevanceService.rankFAQs(combined, {
            page_type: context.page_type,
            entity_type: context.entity_type,
            entity_id: context.entity_id,
            applicable_faq_types: context.applicable_faq_types,
        });
        // Deduplicate
        const deduped = faq_deduplication_service_1.FAQDeduplicationService.deduplicateFAQs(ranked);
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
    static async fetchEditorialFAQs(context) {
        const baseFilter = {
            is_deleted: false,
            is_published: true,
            visibility_status: { $ne: 'hidden' },
            faq_type: { $in: context.applicable_faq_types },
        };
        const filters = [baseFilter];
        // Entity-specific filter
        if (context.entity_id) {
            filters.push({
                is_deleted: false,
                is_published: true,
                visibility_status: { $ne: 'hidden' },
                $or: [
                    { entity_id: context.entity_id },
                    { related_cars: context.entity_id },
                    { related_brands: context.entity_id },
                ],
            });
        }
        // Page-targeted filter
        const pageFilter = {
            is_deleted: false,
            is_published: true,
            visibility_status: { $ne: 'hidden' },
            target_page_types: context.page_type,
        };
        filters.push(pageFilter);
        const results = await Promise.allSettled(filters.map((f) => faq_model_1.FAQ.find(f)
            .sort({ priority_score: -1, order: 1 })
            .limit(context.faq_limit * 2)
            .lean()));
        const seen = new Set();
        const merged = [];
        for (const r of results) {
            if (r.status !== 'fulfilled')
                continue;
            for (const faq of r.value) {
                if (!seen.has(faq.faq_id)) {
                    seen.add(faq.faq_id);
                    merged.push(faq);
                }
            }
        }
        return merged;
    }
    static async generateDynamicFAQs(context) {
        if (!context.entity_id || !context.entity_type)
            return [];
        try {
            switch (context.entity_type) {
                case 'variant':
                    return await faq_template_engine_service_1.FAQTemplateEngineService.generateVariantFAQs(context.entity_id);
                case 'car':
                    return await faq_template_engine_service_1.FAQTemplateEngineService.generateCarFAQs(context.entity_id);
                case 'brand':
                    return await faq_template_engine_service_1.FAQTemplateEngineService.generateBrandFAQs(context.entity_id);
                case 'fuel_type':
                    return await faq_template_engine_service_1.FAQTemplateEngineService.generateFuelTypeFAQs(context.entity_id);
                case 'comparison':
                    return await faq_template_engine_service_1.FAQTemplateEngineService.generateComparisonFAQs(context.entity_id.split('_vs_'));
                default:
                    return [];
            }
        }
        catch {
            return [];
        }
    }
}
exports.FAQOrchestratorService = FAQOrchestratorService;
//# sourceMappingURL=faq-orchestrator.service.js.map