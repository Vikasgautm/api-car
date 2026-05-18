"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariantLifecycleService = void 0;
const car_variant_model_1 = require("../../../models/car-variant.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
class VariantLifecycleService {
    /**
     * Set visibility state for a specific section
     */
    static async setSectionVisibility(variantId, sectionKey, visibility, hiddenFields) {
        const variant = await car_variant_model_1.CarVariant.findOne({ variant_id: variantId, is_deleted: false });
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        if (!variant.section_visibility) {
            variant.section_visibility = [];
        }
        // Find existing section visibility or create new
        const existingIndex = variant.section_visibility.findIndex((s) => s.section_key === sectionKey);
        if (existingIndex >= 0) {
            variant.section_visibility[existingIndex] = {
                section_key: sectionKey,
                visibility,
                hidden_fields: hiddenFields || [],
            };
        }
        else {
            variant.section_visibility.push({
                section_key: sectionKey,
                visibility,
                hidden_fields: hiddenFields || [],
            });
        }
        await variant.save();
        return variant;
    }
    /**
     * Set visibility for a specific field
     */
    static async setFieldVisibility(variantId, fieldKey, visibility, isEstimated, confidenceScore) {
        const variant = await car_variant_model_1.CarVariant.findOne({ variant_id: variantId, is_deleted: false });
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        if (!variant.field_visibility) {
            variant.field_visibility = {};
        }
        if (!variant.estimated_fields) {
            variant.estimated_fields = {};
        }
        variant.field_visibility[fieldKey] = visibility;
        variant.estimated_fields[fieldKey] = !!isEstimated;
        if (confidenceScore !== undefined) {
            if (!variant.field_confidence_scores) {
                variant.field_confidence_scores = {};
            }
            variant.field_confidence_scores[fieldKey] = confidenceScore;
        }
        await variant.save();
        return variant;
    }
    /**
     * Mark multiple fields as estimated for upcoming variants
     */
    static async markFieldsAsEstimated(variantId, fieldKeys) {
        const variant = await car_variant_model_1.CarVariant.findOne({ variant_id: variantId, is_deleted: false });
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        if (!variant.estimated_fields) {
            variant.estimated_fields = {};
        }
        for (const fieldKey of fieldKeys) {
            variant.estimated_fields[fieldKey] = true;
        }
        await variant.save();
        return variant;
    }
    /**
     * Unhide all sections when variant/car launches
     */
    static async unhideAllSections(variantId) {
        const variant = await car_variant_model_1.CarVariant.findOne({ variant_id: variantId, is_deleted: false });
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        // Make all sections visible
        if (variant.section_visibility) {
            variant.section_visibility = variant.section_visibility.map((section) => ({
                ...section,
                visibility: 'visible',
                hidden_fields: [],
            }));
        }
        // Clear field-level teaser/hidden/partial states, keep estimated for reference
        if (variant.field_visibility) {
            for (const [fieldKey, visibility] of Object.entries(variant.field_visibility)) {
                if (visibility === 'teaser_only' || visibility === 'partial' || visibility === 'hidden') {
                    variant.field_visibility[fieldKey] = 'visible';
                }
            }
        }
        // Clear hidden sections list
        variant.hidden_sections = [];
        await variant.save();
        return variant;
    }
    /**
     * Get all upcoming variants for a car that need data completion
     */
    static async getUpcomingVariantsNeedingData(carId) {
        return await car_variant_model_1.CarVariant.find({
            car_id: carId,
            is_upcoming: true,
            is_deleted: false,
            $or: [
                { 'specs_normalized': { $eq: null } },
                { 'specs_normalized': { $eq: {} } },
                { field_visibility: { $exists: true, $ne: {} } },
            ],
        }).select('variant_id variant_name market_status');
    }
    /**
     * Get completeness score for upcoming variant (estimation completeness)
     */
    static async getEstimationCompleteness(variantId) {
        const variant = await car_variant_model_1.CarVariant.findOne({ variant_id: variantId, is_deleted: false });
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        const totalFields = Object.keys(variant.estimated_fields || {}).length;
        const estimatedFields = Object.values(variant.estimated_fields || {}).filter(Boolean).length;
        const completionPercent = totalFields > 0 ? Math.round((estimatedFields / totalFields) * 100) : 0;
        return {
            variant_id: variantId,
            variant_name: variant.variant_name,
            is_upcoming: variant.is_upcoming,
            total_estimated_fields: totalFields,
            completed_estimated_fields: estimatedFields,
            estimation_completion_percent: completionPercent,
            field_confidence_scores: variant.field_confidence_scores || {},
        };
    }
    /**
     * Create a teaser-only variant (minimal data)
     */
    static async createTeaserVariant(variantId, teaserData) {
        const variant = await car_variant_model_1.CarVariant.findOne({ variant_id: variantId, is_deleted: false });
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        variant.is_upcoming = true;
        variant.market_status = 'upcoming';
        if (teaserData.price) {
            variant.expected_price = teaserData.price;
        }
        if (teaserData.launch_date) {
            variant.expected_launch_date = teaserData.launch_date;
        }
        if (teaserData.highlights) {
            variant.variant_highlights = teaserData.highlights;
        }
        // Mark all current sections as teaser_only by default
        const sectionKeys = [
            'engine_performance',
            'mileage_range',
            'battery_charging',
            'dimensions_practicality',
            'suspension_steering_brakes',
            'tyres_wheels',
            'safety',
            'adas',
            'comfort_convenience',
            'infotainment_connectivity',
            'connected_car',
            'interior',
            'exterior',
            'warranty',
            'storage_cabin_practicality',
            'driver_display_controls',
        ];
        variant.section_visibility = sectionKeys.map((key) => ({
            section_key: key,
            visibility: 'teaser_only',
            hidden_fields: [],
        }));
        await variant.save();
        return variant;
    }
}
exports.VariantLifecycleService = VariantLifecycleService;
//# sourceMappingURL=variant-lifecycle.service.js.map