import { CheckerResult, HealthIssue, IssueCategory, IssueSeverity, IssuesQueryParams } from "../../dto/content-health.dto";
import { FAQ } from '../../../../models/faq.model';
import { FAQDeduplicationService } from '../../../faqs/services/faq-deduplication.service';

const CHECKER_NAME = 'faq_health';
const SCAN_LIMIT = 500;

function issue(
  severity: IssueSeverity,
  category: IssueCategory,
  entityId: string,
  entityName: string,
  code: string,
  title: string,
  description: string,
  recommendation: string,
): HealthIssue {
  return {
    id: `${category}_${code}_${entityId}`,
    category,
    severity,
    entity_type: 'faq',
    entity_id: entityId,
    entity_name: entityName,
    issue_code: code,
    issue_title: title,
    issue_description: description,
    recommendation,
    edit_url: '/faqs',
    detected_at: new Date().toISOString(),
  };
}

export async function runFaqHealthChecker(_params: IssuesQueryParams): Promise<CheckerResult> {
  try {
    const issues: HealthIssue[] = [];

    const faqs = await FAQ.find({ is_deleted: false })
      .select('faq_id question answer entity_type entity_id canonical_intent_key is_published schema_enabled indexable faq_type tags faq_health_score needs_refresh last_reviewed_at updatedAt')
      .lean()
      .limit(SCAN_LIMIT);

    const THIN_ANSWER_THRESHOLD = 80;
    const STALE_DAYS = 180;
    const now = Date.now();

    for (const faq of faqs) {
      const f = faq as any;
      const label = f.question?.slice(0, 60) ?? f.faq_id;

      // Thin answer detection
      const plainAnswer = (f.answer ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (plainAnswer.length < THIN_ANSWER_THRESHOLD) {
        issues.push(issue(
          'high', 'faq_health', f.faq_id, label,
          'FAQ_THIN_ANSWER', 'Thin Answer',
          `FAQ "${label}" has a very short answer (${plainAnswer.length} chars). Thin content may not rank or provide value.`,
          'Expand the answer to at least 80 characters with useful, specific information.',
        ));
      }

      // Missing entity mapping
      if (f.is_published && !f.entity_type && f.faq_type !== 'editorial') {
        issues.push(issue(
          'medium', 'faq_health', f.faq_id, label,
          'FAQ_NO_ENTITY', 'Missing Entity Mapping',
          `Published FAQ "${label}" has faq_type "${f.faq_type}" but no entity_type is set.`,
          'Assign an entity_type (car, variant, brand, etc.) to enable contextual injection.',
        ));
      }

      // Missing canonical intent key
      if (f.is_published && !f.canonical_intent_key) {
        issues.push(issue(
          'low', 'faq_health', f.faq_id, label,
          'FAQ_NO_CANONICAL_INTENT', 'Missing Canonical Intent Key',
          `FAQ "${label}" has no canonical_intent_key, making deduplication and SEO continuity harder.`,
          'Set a canonical_intent_key to group this FAQ with similar questions.',
        ));
      }

      // Schema-enabled but not indexable (contradiction)
      if (f.schema_enabled && f.indexable === false) {
        issues.push(issue(
          'medium', 'faq_health', f.faq_id, label,
          'FAQ_SCHEMA_NOT_INDEXABLE', 'Schema Enabled on Non-Indexable FAQ',
          `FAQ "${label}" has schema_enabled=true but indexable=false. Structured data on noindex pages is wasted.`,
          'Either enable indexing or disable schema for this FAQ.',
        ));
      }

      // Stale content detection
      const lastUpdated = new Date(f.updatedAt ?? f.last_reviewed_at ?? 0).getTime();
      const daysSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60 * 24);
      if (f.is_published && daysSinceUpdate > STALE_DAYS) {
        issues.push(issue(
          'low', 'faq_health', f.faq_id, label,
          'FAQ_STALE', 'Stale FAQ Content',
          `FAQ "${label}" was last updated ${Math.round(daysSinceUpdate)} days ago and may be outdated.`,
          'Review and refresh the FAQ content to ensure accuracy.',
        ));
      }

      // No tags on published editorial FAQ
      if (f.is_published && f.faq_type === 'editorial' && (!f.tags || f.tags.length === 0)) {
        issues.push(issue(
          'low', 'faq_health', f.faq_id, label,
          'FAQ_NO_TAGS', 'Published FAQ Missing Tags',
          `Editorial FAQ "${label}" has no tags, reducing discoverability.`,
          'Add relevant automotive tags (e.g., mileage, safety, comparison) to improve discovery.',
        ));
      }
    }

    // Duplicate detection (across all published FAQs)
    try {
      const dupeGroups = await FAQDeduplicationService.findAllDuplicates();
      for (const group of dupeGroups) {
        for (let i = 0; i < group.faq_ids.length; i++) {
          issues.push(issue(
            'high', 'faq_health', group.faq_ids[i], group.questions[i]?.slice(0, 60) ?? group.faq_ids[i],
            'FAQ_DUPLICATE', 'Duplicate FAQ Detected',
            `FAQ "${group.questions[i]?.slice(0, 60)}" is semantically similar to ${group.faq_ids.length - 1} other FAQ(s). This causes keyword cannibalization.`,
            'Merge or differentiate these FAQs to avoid duplicate content penalties.',
          ));
        }
      }
    } catch (_e) { /* non-fatal */ }

    // Orphan FAQs: published with entity_id set but entity doesn't exist in DB
    // (lightweight check — only for car entity_type)
    try {
      const carEntityFaqs = await FAQ.find({
        is_deleted: false,
        is_published: true,
        entity_type: 'car',
        entity_id: { $exists: true, $ne: '' },
      })
        .select('faq_id question entity_id')
        .limit(200)
        .lean();

      if (carEntityFaqs.length > 0) {
        const { Car } = await import('../../../../models/car.model');
        const carIds = [...new Set((carEntityFaqs as any[]).map((f: any) => f.entity_id))];
        const existingCars = await Car.find({ car_id: { $in: carIds }, is_deleted: false })
          .select('car_id')
          .lean();
        const existingSet = new Set((existingCars as any[]).map((c: any) => c.car_id));

        for (const faq of carEntityFaqs as any[]) {
          if (!existingSet.has(faq.entity_id)) {
            issues.push(issue(
              'high', 'faq_health', faq.faq_id, faq.question?.slice(0, 60) ?? faq.faq_id,
              'FAQ_ORPHAN_ENTITY', 'Orphan FAQ — Entity Not Found',
              `FAQ is linked to car entity_id "${faq.entity_id}" which no longer exists.`,
              'Relink this FAQ to a valid car or remove the entity reference.',
            ));
          }
        }
      }
    } catch (_e) { /* non-fatal */ }

    // Excessive FAQ count per entity (> 20 published FAQs on a single entity)
    try {
      const countByEntity = await FAQ.aggregate([
        { $match: { is_deleted: false, is_published: true, entity_id: { $exists: true, $ne: '' } } },
        { $group: { _id: { entity_type: '$entity_type', entity_id: '$entity_id' }, count: { $sum: 1 } } },
        { $match: { count: { $gt: 20 } } },
        { $limit: 30 },
      ]);

      for (const group of countByEntity) {
        issues.push(issue(
          'medium', 'faq_health',
          `${group._id.entity_type}_${group._id.entity_id}`,
          `${group._id.entity_type}: ${group._id.entity_id}`,
          'FAQ_EXCESSIVE_COUNT', 'Excessive FAQ Count on Entity',
          `Entity "${group._id.entity_type}:${group._id.entity_id}" has ${group.count} published FAQs. This may cause FAQ spam and crawl bloat.`,
          'Review and reduce FAQs to the recommended page limit (6–18 depending on page type).',
        ));
      }
    } catch (_e) { /* non-fatal */ }

    return { checker: CHECKER_NAME, issues, total: issues.length };
  } catch (err: any) {
    return { checker: CHECKER_NAME, issues: [], total: 0, error: err?.message || 'FAQ health checker failed' };
  }
}
