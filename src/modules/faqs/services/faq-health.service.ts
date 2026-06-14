import { FAQ } from '../../../models/faq.model';
import { Car } from '../../../models/car.model';
import { Brand } from '../../../models/brand.model';
import { CarVariant } from '../../../models/car-variant.model';
import { BodyType } from '../../../models/body-type.model';
import { FuelType } from '../../../models/fuel-type.model';
import { AppError } from '../../../shared/utils/app-error.util';

export interface FAQHealthResult {
  faq_id: string;
  faq_health_score: number;
  freshness_score: number;
  needs_refresh: boolean;
  flags: string[];
}

const THIN_ANSWER_THRESHOLD = 80;
const VERY_THIN_ANSWER_THRESHOLD = 40;

// Resolve whether an entity referenced by an FAQ still exists. Used to detect
// dangling links (a car/brand/blog was deleted but the FAQ still points at it).
async function entityExists(entityType: string, entityId: string): Promise<boolean> {
  if (!entityType || !entityId) return true; // nothing to validate
  try {
    switch (entityType) {
      case 'car':
        return !!(await Car.exists({ car_id: entityId, is_deleted: false }));
      case 'brand':
        return !!(await Brand.exists({ brand_id: entityId, is_deleted: false }));
      case 'variant':
        return !!(await CarVariant.exists({ variant_id: entityId, is_deleted: false }));
      case 'body_type':
        return !!(await BodyType.exists({ body_type_id: entityId, is_deleted: false }));
      case 'fuel_type':
        return !!(await FuelType.exists({ fuel_type_id: entityId, is_deleted: false }));
      // comparison / seo_collection / global / blog are not validated here.
      default:
        return true;
    }
  } catch {
    return true; // never penalise on a lookup failure
  }
}

export class FAQHealthService {
  /**
   * Compute and persist faq_health_score, freshness_score and needs_refresh for a
   * single FAQ. Mirrors BlogFreshnessService.checkBlog: scores are derived from
   * deterministic heuristics (the same ones the content-health checker reports on)
   * and written back so the Review Queue and relevance ranking have real signals.
   */
  static async checkFaq(faqId: string): Promise<FAQHealthResult> {
    const faq = await FAQ.findOne({ faq_id: faqId, is_deleted: false }).lean();
    if (!faq) throw new AppError('FAQ not found', 404);

    const f = faq as any;
    const flags: string[] = [];

    // ---- Health (content quality) ----
    let healthDeduction = 0;
    const plainAnswer = (f.answer ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (plainAnswer.length < VERY_THIN_ANSWER_THRESHOLD) {
      healthDeduction += 50;
      flags.push('very_thin_answer');
    } else if (plainAnswer.length < THIN_ANSWER_THRESHOLD) {
      healthDeduction += 30;
      flags.push('thin_answer');
    }

    if (f.is_published && !f.entity_type && f.faq_type !== 'editorial') {
      healthDeduction += 10;
      flags.push('missing_entity_mapping');
    }
    if (f.schema_enabled && f.indexable === false) {
      healthDeduction += 10;
      flags.push('schema_on_noindex');
    }
    if (f.is_published && f.faq_type === 'editorial' && (!f.tags || f.tags.length === 0)) {
      healthDeduction += 5;
      flags.push('no_tags');
    }
    if (f.is_published && !f.canonical_intent_key) {
      healthDeduction += 5;
      flags.push('no_canonical_intent');
    }

    // Dangling entity references — primary entity + related_entities[].
    const refs: Array<{ entity_type: string; entity_id: string }> = [];
    if (f.entity_type && f.entity_id) refs.push({ entity_type: f.entity_type, entity_id: f.entity_id });
    if (Array.isArray(f.related_entities)) {
      for (const r of f.related_entities) {
        if (r?.entity_type && r?.entity_id) refs.push({ entity_type: r.entity_type, entity_id: r.entity_id });
      }
    }
    let danglingCount = 0;
    const checked = await Promise.allSettled(refs.map((r) => entityExists(r.entity_type, r.entity_id)));
    for (const c of checked) {
      if (c.status === 'fulfilled' && c.value === false) danglingCount += 1;
    }
    if (danglingCount > 0) {
      healthDeduction += Math.min(40, danglingCount * 20);
      flags.push(`${danglingCount}_dangling_entity_ref`);
    }

    const faq_health_score = Math.max(0, 100 - healthDeduction);

    // ---- Freshness (recency) ----
    const lastTouched = new Date(f.last_reviewed_at ?? f.updatedAt ?? Date.now()).getTime();
    const ageDays = (Date.now() - lastTouched) / (1000 * 60 * 60 * 24);
    let freshDeduction = 0;
    if (ageDays > 365) {
      freshDeduction += 40;
      flags.push('older_than_1_year');
    } else if (ageDays > 180) {
      freshDeduction += 20;
      flags.push('older_than_6_months');
    } else if (ageDays > 90) {
      freshDeduction += 10;
      flags.push('older_than_3_months');
    }
    const freshness_score = Math.max(0, 100 - freshDeduction);

    // needs_refresh: meaningful quality or recency problem that an editor should act on.
    const needs_refresh =
      faq_health_score < 60 || freshness_score < 50 || danglingCount > 0 || plainAnswer.length < THIN_ANSWER_THRESHOLD;

    await FAQ.updateOne(
      { faq_id: faqId },
      { $set: { faq_health_score, freshness_score, needs_refresh } },
    );

    return { faq_id: faqId, faq_health_score, freshness_score, needs_refresh, flags };
  }

  /**
   * Recompute health for a batch of non-deleted FAQs. Admin-triggered, mirroring
   * BlogFreshnessService.runBulkFreshnessCheck.
   */
  static async runBulkHealthCheck(limit = 500): Promise<{ processed: number; succeeded: number; needs_refresh: number }> {
    const faqs = await FAQ.find({ is_deleted: false }).select('faq_id').limit(limit).lean();

    const results = await Promise.allSettled(faqs.map((f: any) => FAQHealthService.checkFaq(f.faq_id)));

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const needsRefresh = results
      .filter((r): r is PromiseFulfilledResult<FAQHealthResult> => r.status === 'fulfilled')
      .filter((r) => r.value.needs_refresh).length;

    return { processed: faqs.length, succeeded, needs_refresh: needsRefresh };
  }
}
