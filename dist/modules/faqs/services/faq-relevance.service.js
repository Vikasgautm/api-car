"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAQRelevanceService = void 0;
// FAQ types that carry higher SEO value
const HIGH_SEO_TYPES = new Set(['specification', 'performance', 'safety', 'comparison', 'upcoming']);
const MEDIUM_SEO_TYPES = new Set(['feature', 'dimensions', 'collection', 'aggregation']);
class FAQRelevanceService {
    static scoreRelevance(faq, context) {
        let score = faq.priority_score ?? 50;
        // Boost for entity match
        if (context.entity_id && faq.entity_id === context.entity_id)
            score += 30;
        if (context.entity_type && faq.entity_type === context.entity_type)
            score += 10;
        // Boost for applicable FAQ type
        const faqType = faq.faq_type ?? 'editorial';
        if (context.applicable_faq_types.includes(faqType))
            score += 20;
        // SEO priority boost
        if (HIGH_SEO_TYPES.has(faqType))
            score += 15;
        else if (MEDIUM_SEO_TYPES.has(faqType))
            score += 8;
        // Freshness factor
        const freshnessScore = faq.freshness_score ?? 100;
        if (freshnessScore < 40)
            score -= 20;
        else if (freshnessScore < 70)
            score -= 10;
        // Editorial FAQs get a small base boost over dynamically generated ones
        if (faq.is_editorial === true && !faq.is_dynamic)
            score += 5;
        // Published, non-deleted, visible FAQs only
        if (faq.is_published === false)
            score -= 50;
        if (faq.is_deleted === true)
            score -= 100;
        // Health score factor
        const health = faq.faq_health_score ?? 100;
        if (health < 40)
            score -= 25;
        else if (health < 70)
            score -= 10;
        return Math.max(0, Math.min(200, score));
    }
    static rankFAQs(faqs, context) {
        return faqs
            .map((faq) => ({ faq, score: FAQRelevanceService.scoreRelevance(faq, context) }))
            .sort((a, b) => b.score - a.score)
            .map(({ faq }) => faq);
    }
    static applyPageLimit(faqs, limit) {
        return faqs.slice(0, limit);
    }
    static rankGeneratedFAQs(faqs, context) {
        return faqs
            .map((faq) => ({
            faq,
            score: FAQRelevanceService.scoreGeneratedFAQ(faq, context),
        }))
            .sort((a, b) => b.score - a.score)
            .map(({ faq }) => faq);
    }
    static scoreGeneratedFAQ(faq, context) {
        let score = faq.priority_score;
        if (context.entity_id && faq.entity_id === context.entity_id)
            score += 25;
        if (context.applicable_faq_types.includes(faq.faq_type))
            score += 15;
        if (HIGH_SEO_TYPES.has(faq.faq_type))
            score += 10;
        return score;
    }
}
exports.FAQRelevanceService = FAQRelevanceService;
