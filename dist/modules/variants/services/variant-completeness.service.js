"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariantCompletenessService = void 0;
const car_variant_model_1 = require("../../../models/car-variant.model");
const car_model_1 = require("../../../models/car.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
class VariantCompletenessService {
    static async getVariantCompleteness(variantId) {
        const variant = await car_variant_model_1.CarVariant.findById(variantId);
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        return this.scoreVariant(variant, variantId);
    }
    // Internal method that accepts variant object directly (no refetch)
    static scoreVariant(variant, variantId) {
        const basicInfoScore = this.scoreBasicInfo(variant);
        const specsScore = this.scoreSpecs(variant);
        const seoScore = this.scoreSeo(variant);
        const pricingScore = this.scorePricing(variant);
        const statusScore = this.scoreStatus(variant);
        const overallScore = Math.round((basicInfoScore + specsScore + seoScore + pricingScore + statusScore) / 5);
        const missingFields = this.getMissingFields(variant);
        const emptySections = this.getEmptySections(variant);
        const recommendation = this.generateRecommendation(overallScore, missingFields, emptySections);
        return {
            variant_id: variantId,
            variant_name: variant.variant_name,
            overall_score: overallScore,
            basic_info_score: basicInfoScore,
            specs_score: specsScore,
            seo_score: seoScore,
            pricing_score: pricingScore,
            status_score: statusScore,
            missing_sections: emptySections,
            empty_sections: missingFields,
            recommendation,
        };
    }
    static async getCarCompleteness(carId) {
        const car = await car_model_1.Car.findById(carId);
        if (!car) {
            throw new app_error_util_1.AppError('Car not found', 404);
        }
        // Fetch all variants with full data (not just _id) to avoid refetching in loop
        const variants = await car_variant_model_1.CarVariant.find({ car_id: carId });
        const metrics = [];
        let totalScore = 0;
        // Score each variant without refetching
        for (const variant of variants) {
            const metric = this.scoreVariant(variant, variant._id.toString());
            metrics.push(metric);
            totalScore += metric.overall_score;
        }
        const avgCompleteness = variants.length > 0 ? Math.round(totalScore / variants.length) : 0;
        // Score distribution
        const variantsByScore = {
            excellent: 0,
            good: 0,
            fair: 0,
            poor: 0,
        };
        metrics.forEach((m) => {
            if (m.overall_score >= 80)
                variantsByScore['excellent']++;
            else if (m.overall_score >= 60)
                variantsByScore['good']++;
            else if (m.overall_score >= 40)
                variantsByScore['fair']++;
            else
                variantsByScore['poor']++;
        });
        // Critical gaps
        const gapCounts = {};
        metrics.forEach((m) => {
            m.missing_sections.forEach((section) => {
                gapCounts[section] = (gapCounts[section] || 0) + 1;
            });
        });
        const criticalGaps = Object.entries(gapCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([field, count]) => `${field} (${count} variants missing)`);
        return {
            car_id: carId,
            car_name: car.name,
            avg_completeness: avgCompleteness,
            total_variants: variants.length,
            variants_by_score: variantsByScore,
            critical_gaps: criticalGaps,
            metrics,
        };
    }
    static scoreBasicInfo(variant) {
        let score = 0;
        const checks = [
            variant.variant_name,
            variant.fuel_type_id,
            variant.transmission_type,
            variant.seating_capacity,
            variant.body_type,
        ];
        const passed = checks.filter((c) => c).length;
        score = Math.round((passed / checks.length) * 100);
        return score;
    }
    static scoreSpecs(variant) {
        if (!variant.specs_normalized || Object.keys(variant.specs_normalized).length === 0) {
            return 0;
        }
        const specs = variant.specs_normalized;
        const sections = Object.keys(specs).filter((k) => typeof specs[k] === 'object' && specs[k] !== null && !Array.isArray(specs[k]));
        if (sections.length === 0)
            return 0;
        let filledSections = 0;
        let totalFields = 0;
        sections.forEach((section) => {
            const sectionData = specs[section];
            const fields = Object.keys(sectionData).filter((k) => sectionData[k]);
            if (fields.length > 0) {
                filledSections++;
            }
            totalFields += Object.keys(sectionData).length;
        });
        const sectionScore = (filledSections / sections.length) * 50;
        const fieldScore = (Math.min(totalFields, 20) / 20) * 50;
        return Math.round(sectionScore + fieldScore);
    }
    static scoreSeo(variant) {
        let score = 0;
        const checks = 0;
        let passed = 0;
        // Check if has slug
        if (variant.slug) {
            passed++;
            score += 20;
        }
        // Check if published
        if (variant.is_published) {
            passed++;
            score += 20;
        }
        // Check model year
        if (variant.model_year) {
            passed++;
            score += 20;
        }
        // Check if has meaningful specs
        if (variant.specs_normalized &&
            Object.keys(variant.specs_normalized).length > 5) {
            passed++;
            score += 20;
        }
        // Check variant status
        if (variant.variant_status && variant.variant_status !== 'draft') {
            passed++;
            score += 20;
        }
        return score;
    }
    static scorePricing(variant) {
        let score = 0;
        if (variant.ex_showroom_price) {
            score += 50;
        }
        else if (variant.expected_price) {
            score += 30;
        }
        if (variant.expected_launch_date || variant.model_year) {
            score += 50;
        }
        else {
            score += 25;
        }
        return Math.min(100, score);
    }
    static scoreStatus(variant) {
        const status = variant.variant_status;
        const publishStatus = {
            draft: 20,
            incomplete: 40,
            review_pending: 60,
            hidden: 70,
            upcoming: 80,
            launched: 100,
            discontinued: 60,
        };
        return publishStatus[status] || 20;
    }
    static getMissingFields(variant) {
        const missing = [];
        if (!variant.variant_name)
            missing.push('variant_name');
        if (!variant.fuel_type_id)
            missing.push('fuel_type_id');
        if (!variant.transmission_type)
            missing.push('transmission_type');
        if (!variant.seating_capacity)
            missing.push('seating_capacity');
        if (!variant.ex_showroom_price && !variant.expected_price)
            missing.push('pricing');
        if (!variant.model_year && !variant.expected_launch_date)
            missing.push('year_or_launch_date');
        return missing;
    }
    static getEmptySections(variant) {
        const empty = [];
        if (!variant.specs_normalized || Object.keys(variant.specs_normalized).length === 0) {
            empty.push('specs_normalized');
            return empty;
        }
        const specs = variant.specs_normalized;
        Object.keys(specs).forEach((key) => {
            if (typeof specs[key] === 'object' &&
                specs[key] !== null &&
                !Array.isArray(specs[key]) &&
                Object.keys(specs[key]).filter((k) => specs[key][k]).length === 0) {
                empty.push(key);
            }
        });
        return empty;
    }
    static generateRecommendation(score, missing, empty) {
        if (score >= 90) {
            return 'Variant is ready for production publishing';
        }
        else if (score >= 70) {
            return `Good progress. Add: ${missing.slice(0, 2).join(', ')}`;
        }
        else if (score >= 50) {
            return `Fill critical sections: ${empty.slice(0, 3).join(', ')}`;
        }
        else {
            return 'Variant needs substantial completion work';
        }
    }
}
exports.VariantCompletenessService = VariantCompletenessService;
//# sourceMappingURL=variant-completeness.service.js.map