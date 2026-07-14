"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoCollectionHealthService = void 0;
const seo_collection_model_1 = require("../../../models/seo-collection.model");
class SeoCollectionHealthService {
    static async computeHealth(input) {
        let score = 100;
        // Car count
        if (input.matched_car_count === 0)
            score -= 50;
        else if (input.matched_car_count < 3)
            score -= 30;
        else if (input.matched_car_count < 6)
            score -= 10;
        // SEO completeness
        if (!input.seo?.h1)
            score -= 10;
        if (!input.seo?.meta_title)
            score -= 8;
        if (!input.seo?.meta_description)
            score -= 8;
        if (!input.seo?.intro_content)
            score -= 8;
        // FAQs
        if (!input.faq_items?.length)
            score -= 6;
        // Slug
        if (!input.slug)
            score -= 10;
        score = Math.max(0, Math.min(100, score));
        // Duplicate risk: same fuel + body + budget combo
        let duplicate_risk_score = 0;
        if (input.fuel_type_ids?.length && input.collection_id) {
            const q = {
                collection_id: { $ne: input.collection_id },
                is_deleted: false,
            };
            if (input.fuel_type_ids?.length)
                q.fuel_type_ids = { $all: input.fuel_type_ids };
            if (input.body_type_ids?.length)
                q.body_type_ids = { $all: input.body_type_ids };
            q.budget_max = input.budget_max ?? null;
            const similar = await seo_collection_model_1.SeoCollection.countDocuments(q);
            duplicate_risk_score = Math.min(100, similar * 50);
        }
        const auto_noindex = input.matched_car_count < 3 ||
            duplicate_risk_score >= 50 ||
            score < 30;
        return {
            health_score: score,
            duplicate_risk_score,
            auto_noindex,
            seo_index_status: auto_noindex ? 'noindex' : 'index',
        };
    }
    static async refreshCollection(collection_id) {
        const collection = await seo_collection_model_1.SeoCollection.findOne({ collection_id, is_deleted: false }).lean();
        if (!collection)
            return;
        const result = await this.computeHealth({
            collection_id: collection.collection_id,
            matched_car_count: collection.matched_car_count,
            seo: collection.seo,
            faq_items: collection.faq_items,
            slug: collection.slug,
            fuel_type_ids: collection.fuel_type_ids,
            body_type_ids: collection.body_type_ids,
            budget_min: collection.budget_min,
            budget_max: collection.budget_max,
        });
        // Respect manual override: only apply auto_noindex, not override manual 'noindex' back to 'index'
        const update = {
            health_score: result.health_score,
            duplicate_risk_score: result.duplicate_risk_score,
            auto_noindex: result.auto_noindex,
        };
        if (result.auto_noindex) {
            update.seo_index_status = 'noindex';
        }
        await seo_collection_model_1.SeoCollection.updateOne({ collection_id }, update);
    }
}
exports.SeoCollectionHealthService = SeoCollectionHealthService;
