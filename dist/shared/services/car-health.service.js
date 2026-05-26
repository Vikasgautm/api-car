"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarHealthService = void 0;
const faq_model_1 = require("../../models/faq.model");
const DESCRIPTION_STRONG_CHARS = 200;
const DESCRIPTION_WEAK_CHARS = 50;
const hasContent = (s) => typeof s === 'string' && s.trim().length > 0;
const stripHtml = (s) => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const descriptionCredit = (description) => {
    if (!hasContent(description))
        return 0;
    const plain = stripHtml(description);
    if (plain.length >= DESCRIPTION_STRONG_CHARS)
        return 1;
    if (plain.length >= DESCRIPTION_WEAK_CHARS)
        return 0.5;
    return 0;
};
const hasPricing = (car) => (typeof car.min_variant_price === 'number' && car.min_variant_price > 0) ||
    (typeof car.max_variant_price === 'number' && car.max_variant_price > 0) ||
    (typeof car.expected_exshowroom_price === 'number' && car.expected_exshowroom_price > 0) ||
    (typeof car.exshowroom_price === 'number' && car.exshowroom_price > 0);
const hasImages = (car) => !!(car.thumbnail && hasContent(car.thumbnail.url)) ||
    (Array.isArray(car.images) && car.images.length > 0);
const hasMileage = (car) => {
    const hasFuelMileage = typeof car.mileage_min_kmpl === 'number' && car.mileage_min_kmpl > 0;
    const hasEVRange = typeof car.range_min_km === 'number' && car.range_min_km > 0;
    return hasFuelMileage || hasEVRange;
};
const hasTransmission = (car) => Array.isArray(car.aggregated_transmission_types) && car.aggregated_transmission_types.length > 0;
const hasSafetyData = (car) => (typeof car.max_airbags === 'number' && car.max_airbags > 0) ||
    (typeof car.best_ncap_rating === 'number' && car.best_ncap_rating >= 0);
class CarHealthService {
    // Batched FAQ counts keyed by car_id. Single aggregation across the whole page.
    static async getFaqCountsByCar(carIds) {
        const counts = new Map();
        if (carIds.length === 0)
            return counts;
        const rows = await faq_model_1.FAQ.aggregate([
            { $match: { related_cars: { $in: carIds }, is_deleted: false } },
            { $unwind: '$related_cars' },
            { $match: { related_cars: { $in: carIds } } },
            { $group: { _id: '$related_cars', count: { $sum: 1 } } },
        ]);
        for (const row of rows) {
            if (typeof row._id === 'string')
                counts.set(row._id, row.count);
        }
        return counts;
    }
    // Pure function — given a car and its FAQ count, derive issues + score.
    // Kept pure so the cars service can call it in a tight loop without extra IO.
    static compute(car, faqCount) {
        const issues = [];
        const metaOk = hasContent(car.meta_title) && hasContent(car.meta_description);
        if (!metaOk)
            issues.push('Missing Meta');
        const descCredit = descriptionCredit(car.description);
        if (descCredit < 1)
            issues.push('Weak Content');
        if (faqCount === 0)
            issues.push('Missing FAQ');
        if (!hasImages(car))
            issues.push('Missing Images');
        const incompleteCount = car.incomplete_variant_count ?? 0;
        const variantCount = car.variant_count ?? 0;
        if (variantCount > 0 && incompleteCount > 0)
            issues.push('Incomplete Variants');
        if (variantCount > 0 && !hasMileage(car))
            issues.push('Missing Mileage');
        if (variantCount > 0 && !hasTransmission(car))
            issues.push('Missing Transmission');
        if (variantCount > 0 && !hasSafetyData(car))
            issues.push('Missing Safety');
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
        const earned = descCredit +
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
        const completeness_misses = [];
        if (descCredit === 0) {
            completeness_misses.push({ key: 'description', label: 'No description', severity: 'missing' });
        }
        else if (descCredit < 1) {
            completeness_misses.push({ key: 'description', label: `Description too short (under ${DESCRIPTION_STRONG_CHARS} chars)`, severity: 'weak' });
        }
        if (!variantsOk)
            completeness_misses.push({ key: 'variants', label: 'No variants added', severity: 'missing' });
        if (!thumbnailOk)
            completeness_misses.push({ key: 'thumbnail', label: 'No thumbnail image', severity: 'missing' });
        if (!imagesOk)
            completeness_misses.push({ key: 'images', label: 'No gallery images', severity: 'missing' });
        if (faqCount === 0)
            completeness_misses.push({ key: 'faq', label: 'No FAQs linked', severity: 'missing' });
        if (!metaOk)
            completeness_misses.push({ key: 'meta', label: 'Missing meta title or description', severity: 'missing' });
        if (!fuelOk)
            completeness_misses.push({ key: 'fuel_types', label: 'No fuel types aggregated from variants', severity: 'missing' });
        if (!bodyTypeOk)
            completeness_misses.push({ key: 'body_type', label: 'Body type unset', severity: 'missing' });
        if (!pricingOk)
            completeness_misses.push({ key: 'pricing', label: 'No price on any variant (ex-showroom or expected)', severity: 'missing' });
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
exports.CarHealthService = CarHealthService;
//# sourceMappingURL=car-health.service.js.map