import { SeoCollection } from '../../../models/seo-collection.model';

interface HealthInput {
  collection_id?: string;
  matched_car_count: number;
  seo?: {
    h1?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    intro_content?: string | null;
  };
  faq_items?: Array<any>;
  slug?: string;
  fuel_type_ids?: string[];
  body_type_ids?: string[];
  budget_min?: number | null;
  budget_max?: number | null;
}

interface HealthResult {
  health_score: number;
  duplicate_risk_score: number;
  auto_noindex: boolean;
  seo_index_status: 'index' | 'noindex';
}

export class SeoCollectionHealthService {
  static async computeHealth(input: HealthInput): Promise<HealthResult> {
    let score = 100;

    // Car count
    if (input.matched_car_count === 0) score -= 50;
    else if (input.matched_car_count < 3) score -= 30;
    else if (input.matched_car_count < 6) score -= 10;

    // SEO completeness
    if (!input.seo?.h1) score -= 10;
    if (!input.seo?.meta_title) score -= 8;
    if (!input.seo?.meta_description) score -= 8;
    if (!input.seo?.intro_content) score -= 8;

    // FAQs
    if (!input.faq_items?.length) score -= 6;

    // Slug
    if (!input.slug) score -= 10;

    score = Math.max(0, Math.min(100, score));

    // Duplicate risk: same fuel + body + budget combo
    let duplicate_risk_score = 0;
    if (input.fuel_type_ids?.length && input.collection_id) {
      const q: Record<string, any> = {
        collection_id: { $ne: input.collection_id },
        is_deleted: false,
      };
      if (input.fuel_type_ids?.length) q.fuel_type_ids = { $all: input.fuel_type_ids };
      if (input.body_type_ids?.length) q.body_type_ids = { $all: input.body_type_ids };
      q.budget_max = input.budget_max ?? null;
      const similar = await SeoCollection.countDocuments(q);
      duplicate_risk_score = Math.min(100, similar * 50);
    }

    const auto_noindex =
      input.matched_car_count < 3 ||
      duplicate_risk_score >= 50 ||
      score < 30;

    return {
      health_score: score,
      duplicate_risk_score,
      auto_noindex,
      seo_index_status: auto_noindex ? 'noindex' : 'index',
    };
  }

  static async refreshCollection(collection_id: string): Promise<void> {
    const collection = await SeoCollection.findOne({ collection_id, is_deleted: false }).lean();
    if (!collection) return;

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
    const update: Record<string, any> = {
      health_score: result.health_score,
      duplicate_risk_score: result.duplicate_risk_score,
      auto_noindex: result.auto_noindex,
    };
    if (result.auto_noindex) {
      update.seo_index_status = 'noindex';
    }

    await SeoCollection.updateOne({ collection_id }, update);
  }
}
