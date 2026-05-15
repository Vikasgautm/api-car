import { FAQ } from '../../models/faq.model';

// SEO issue labels surfaced on the cars list (column copy is rendered as-is).
// Order matters — the frontend shows them in this order when several apply.
export type SeoIssue =
  | 'Missing Meta'
  | 'Weak Content'
  | 'Missing FAQ'
  | 'Missing Images';

export interface CarHealth {
  seo_health_issues: SeoIssue[];
  // 0–100 integer percent. Each of 9 checks contributes ~11.11%; the description
  // check is split into full/partial credit so prose-rich cars don't get penalised
  // for being slightly under the threshold.
  completeness_score: number;
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
  aggregated_fuel_types?: string[] | null;
  min_variant_price?: number | null;
  max_variant_price?: number | null;
  expected_exshowroom_price?: number | null;
  exshowroom_price?: number | null;
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

    // Completeness: 9 checks. Each worth 1 point; description awards 0/0.5/1.
    const variantsOk = (car.variant_count ?? 0) > 0;
    const fuelOk = Array.isArray(car.aggregated_fuel_types) && car.aggregated_fuel_types.length > 0;
    const bodyTypeOk = hasContent(car.body_type_id);
    const pricingOk = hasPricing(car);
    const thumbnailOk = !!(car.thumbnail && hasContent(car.thumbnail.url));
    const imagesOk = Array.isArray(car.images) && car.images.length > 0;

    const earned =
      descCredit +
      (variantsOk ? 1 : 0) +
      (imagesOk ? 1 : 0) +
      (faqCount > 0 ? 1 : 0) +
      (metaOk ? 1 : 0) +
      (fuelOk ? 1 : 0) +
      (bodyTypeOk ? 1 : 0) +
      (pricingOk ? 1 : 0) +
      (thumbnailOk ? 1 : 0);

    const completeness_score = Math.round((earned / 9) * 100);

    return { seo_health_issues: issues, completeness_score };
  }
}
