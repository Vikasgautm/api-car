"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariantCompletenessCalculator = void 0;
const KEY_SPECS = [
    'max_power', 'max_torque', 'displacement', 'mileage', 'arai_mileage',
    'fuel_tank_capacity', 'seating_capacity', 'boot_space', 'airbags',
    'length', 'width', 'height', 'wheelbase',
];
class VariantCompletenessCalculator {
    static calculate(input) {
        const specs = { ...(input.normalized_specs || {}), ...(input.raw_specs || {}) };
        const missingFlags = [];
        // Specs score (40%) — based on key specs coverage
        const filledKeySpecs = KEY_SPECS.filter(k => specs[k] !== undefined && specs[k] !== null && specs[k] !== '').length;
        const hasBasicFields = (input.price ? 1 : 0) + (input.fuel_type ? 1 : 0) + (input.transmission ? 1 : 0);
        const specsRaw = Math.round(((filledKeySpecs / KEY_SPECS.length) * 0.7 + (hasBasicFields / 3) * 0.3) * 100);
        const specsScore = Math.min(40, Math.round((specsRaw / 100) * 40));
        if (specsRaw < 50)
            missingFlags.push('missing_key_specs');
        // Images score (20%)
        const hasImages = input.has_images || (input.image_count !== undefined && input.image_count > 0);
        const imageScore = hasImages ? 20 : 0;
        if (!hasImages)
            missingFlags.push('missing_images');
        // SEO score (10%)
        const seoScore = (input.has_meta_title && input.has_meta_description) ? 10 : (input.has_meta_title || input.has_meta_description) ? 5 : 0;
        if (!input.has_meta_title || !input.has_meta_description)
            missingFlags.push('missing_seo');
        // FAQs score (10%)
        const faqScore = input.has_faqs ? 10 : 0;
        if (!input.has_faqs)
            missingFlags.push('missing_faqs');
        // Descriptions score (10%)
        const descScore = input.has_description ? 10 : 0;
        if (!input.has_description)
            missingFlags.push('missing_descriptions');
        // Feature mapping score (10%)
        const featureScore = input.has_feature_mapping ? 10 : 0;
        if (!input.has_feature_mapping)
            missingFlags.push('missing_feature_mapping');
        const total = specsScore + imageScore + seoScore + faqScore + descScore + featureScore;
        return {
            score: total,
            breakdown: {
                specs: specsScore,
                images: imageScore,
                seo: seoScore,
                faqs: faqScore,
                descriptions: descScore,
                feature_mapping: featureScore,
            },
            missing_flags: missingFlags,
        };
    }
}
exports.VariantCompletenessCalculator = VariantCompletenessCalculator;
//# sourceMappingURL=VariantCompletenessCalculator.js.map