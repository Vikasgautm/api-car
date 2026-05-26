import { FAQ } from '../../models/faq.model';

// SEO issue labels surfaced on the cars list (column copy is rendered as-is).
// Order matters — the frontend shows them in this order when several apply.
export type SeoIssue =
  | 'Missing Meta'
  | 'Weak Content'
  | 'Missing FAQ'
  | 'Missing Images'
  | 'Incomplete Variants'
  | 'Missing Mileage'
  | 'Missing Transmission'
  | 'Missing Safety';

// One row per failed/partial completeness check, surfaced as an insights drawer
// so admins know exactly what needs fixing instead of guessing from a percent.
export type CompletenessKey =
  | 'description'
  | 'variants'
  | 'images'
  | 'thumbnail'
  | 'faq'
  | 'meta'
  | 'fuel_types'
  | 'body_type'
  | 'pricing'
  | 'mileage'
  | 'transmission'
  | 'safety';

export type CompletenessSeverity = 'missing' | 'weak';

export interface CompletenessMiss {
  key: CompletenessKey;
  label: string;
  severity: CompletenessSeverity;
}

export interface CarHealth {
  seo_health_issues: SeoIssue[];
  // 0–100 integer percent. Each of 9 checks contributes ~11.11%; the description
  // check is split into full/partial credit so prose-rich cars don't get penalised
  // for being slightly under the threshold.
  completeness_score: number;
  // Ordered list of checks that did not pass. Empty means score = 100.
  completeness_misses: CompletenessMiss[];
}

// Inputs the scorer needs from each car. Kept loose because the cars service
// passes lean documents enriched with the Phase B aggregates.
export interface CarHealthInput {
  car_id: string;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  thumbnail?: { url?: string | null } | null;
  images?: Array<unknown> | null;
  body_type_id?: string | null;
  variant_count?: number | null;
  incomplete_variant_count?: number | null;
  aggregated_fuel_types?: string[] | null;
  aggregated_transmission_types?: string[] | null;
  min_variant_price?: number | null;
  max_variant_price?: number | null;
  expected_exshowroom_price?: number | null;
  exshowroom_price?: number | null;
  // From aggregation: numeric ranges computed from variant specs
  mileage_min_kmpl?: number | null;
  mileage_max_kmpl?: number | null;
  range_min_km?: number | null;
  range_max_km?: number | null;
  best_ncap_rating?: number | null;
  max_airbags?: number | null;
}

const DESCRIPTION_STRONG_CHARS = 200;
const DESCRIPTION_WEAK_CHARS = 50;

const hasContent = (s?: string | null): boolean => typeof s === 'string' && s.trim().length > 0;

const stripHtml = (s: string): string =>
  s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const descriptionCredit = (description?: string | null): number => {
  if (!hasContent(description)) return 0;
  const plain = stripHtml(description as string);
  if (plain.length >= DESCRIPTION_STRONG_CHARS) return 1;
  if (plain.length >= DESCRIPTION_WEAK_CHARS) return 0.5;
  return 0;
};

const hasPricing = (car: CarHealthInput): boolean =>
  (typeof car.min_variant_price === 'number' && car.min_variant_price > 0) ||
  (typeof car.max_variant_price === 'number' && car.max_variant_price > 0) ||
  (typeof car.expected_exshowroom_price === 'number' && car.expected_exshowroom_price > 0) ||
  (typeof car.exshowroom_price === 'number' && car.exshowroom_price > 0);

const hasImages = (car: CarHealthInput): boolean =>
  !!(car.thumbnail && hasContent(car.thumbnail.url)) ||
  (Array.isArray(car.images) && car.images.length > 0);

const hasMileage = (car: CarHealthInput): boolean => {
  const hasFuelMileage = typeof car.mileage_min_kmpl === 'number' && car.mileage_min_kmpl > 0;
  const hasEVRange = typeof car.range_min_km === 'number' && car.range_min_km > 0;
  return hasFuelMileage || hasEVRange;
};

const hasTransmission = (car: CarHealthInput): boolean =>
  Array.isArray(car.aggregated_transmission_types) && car.aggregated_transmission_types.length > 0;

const hasSafetyData = (car: CarHealthInput): boolean =>
  (typeof car.max_airbags === 'number' && car.max_airbags > 0) ||
  (typeof car.best_ncap_rating === 'number' && car.best_ncap_rating >= 0);

export class CarHealthService {
  // Batched FAQ counts keyed by car_id. Single aggregation across the whole page.
  static async getFaqCountsByCar(carIds: string[]): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (carIds.length === 0) return counts;

    const rows = await FAQ.aggregate([
      { $match: { related_cars: { $in: carIds }, is_deleted: false } },
      { $unwind: '$related_cars' },
      { $match: { related_cars: { $in: carIds } } },
      { $group: { _id: '$related_cars', count: { $sum: 1 } } },
    ]);

    for (const row of rows) {
      if (typeof row._id === 'string') counts.set(row._id, row.count);
    }
    return counts;
  }

  // Pure function — given a car and its FAQ count, derive issues + score.
  // Kept pure so the cars service can call it in a tight loop without extra IO.
  static compute(car: CarHealthInput, faqCount: number): CarHealth {
    const issues: SeoIssue[] = [];

    const metaOk = hasContent(car.meta_title) && hasContent(car.meta_description);
    if (!metaOk) issues.push('Missing Meta');

    const descCredit = descriptionCredit(car.description);
    if (descCredit < 1) issues.push('Weak Content');

    if (faqCount === 0) issues.push('Missing FAQ');

    if (!hasImages(car)) issues.push('Missing Images');

    const incompleteCount = car.incomplete_variant_count ?? 0;
    const variantCount = car.variant_count ?? 0;
    if (variantCount > 0 && incompleteCount > 0) issues.push('Incomplete Variants');

    if (variantCount > 0 && !hasMileage(car)) issues.push('Missing Mileage');

    if (variantCount > 0 && !hasTransmission(car)) issues.push('Missing Transmission');

    if (variantCount > 0 && !hasSafetyData(car)) issues.push('Missing Safety');

    // Completeness: 9 checks. Each worth 1 point; description awards 0/0.5/1.
    const variantsOk = variantCount > 0;
    const fuelOk = Array.isArray(car.aggregated_fuel_types) && car.aggregated_fuel_types.length > 0;
    const bodyTypeOk = hasContent(car.body_type_id);
    const pricingOk = hasPricing(car);
    const thumbnailOk = !!(car.thumbnail && hasContent(car.thumbnail.url));
    const imagesOk = Array.isArray(car.images) && car.images.length > 0;
    const mileageOk = !variantsOk || hasMileage(car);
    const transmissionOk = !variantsOk || hasTransmission(car);

    // Extend to 11 checks (9 original + mileage + transmission)
    const earned =
      descCredit +
      (variantsOk ? 1 : 0) +
      (imagesOk ? 1 : 0) +
      (faqCount > 0 ? 1 : 0) +
      (metaOk ? 1 : 0) +
      (fuelOk ? 1 : 0) +
      (bodyTypeOk ? 1 : 0) +
      (pricingOk ? 1 : 0) +
      (thumbnailOk ? 1 : 0) +
      (mileageOk ? 1 : 0) +
      (transmissionOk ? 1 : 0);

    const completeness_score = Math.round((earned / 11) * 100);

    const completeness_misses: CompletenessMiss[] = [];
    if (descCredit === 0) {
      completeness_misses.push({ key: 'description', label: 'No description', severity: 'missing' });
    } else if (descCredit < 1) {
      completeness_misses.push({ key: 'description', label: `Description too short (under ${DESCRIPTION_STRONG_CHARS} chars)`, severity: 'weak' });
    }
    if (!variantsOk) completeness_misses.push({ key: 'variants', label: 'No variants added', severity: 'missing' });
    if (!thumbnailOk) completeness_misses.push({ key: 'thumbnail', label: 'No thumbnail image', severity: 'missing' });
    if (!imagesOk) completeness_misses.push({ key: 'images', label: 'No gallery images', severity: 'missing' });
    if (faqCount === 0) completeness_misses.push({ key: 'faq', label: 'No FAQs linked', severity: 'missing' });
    if (!metaOk) completeness_misses.push({ key: 'meta', label: 'Missing meta title or description', severity: 'missing' });
    if (!fuelOk) completeness_misses.push({ key: 'fuel_types', label: 'No fuel types aggregated from variants', severity: 'missing' });
    if (!bodyTypeOk) completeness_misses.push({ key: 'body_type', label: 'Body type unset', severity: 'missing' });
    if (!pricingOk) completeness_misses.push({ key: 'pricing', label: 'No price on any variant (ex-showroom or expected)', severity: 'missing' });
    if (variantsOk && !mileageOk) {
      completeness_misses.push({ key: 'mileage', label: 'Missing mileage / EV range across all variants', severity: 'missing' });
    }
    if (variantsOk && !transmissionOk) {
      completeness_misses.push({ key: 'transmission', label: 'Missing transmission type across all variants', severity: 'missing' });
    }
    if (variantsOk && incompleteCount > 0) {
      const pct = Math.round((incompleteCount / variantCount) * 100);
      completeness_misses.push({
        key: 'variants',
        label: `${incompleteCount} of ${variantCount} variant${incompleteCount > 1 ? 's' : ''} incomplete (${pct}%)`,
        severity: 'weak',
      });
    }

    return { seo_health_issues: issues, completeness_score, completeness_misses };
  }
}
