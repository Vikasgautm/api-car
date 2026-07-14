"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariantIntegrityService = void 0;
const car_variant_model_1 = require("../../../models/car-variant.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const automotive_validation_rules_1 = require("../../../shared/utils/automotive-validation-rules");
const field_source_metadata_1 = require("../../../shared/utils/field-source-metadata");
const change_history_1 = require("../../../shared/utils/change-history");
class VariantIntegrityService {
    /**
     * Validate variant against automotive constraint rules (Batch 6 Feature 5)
     * Prevents impossible combinations (EV with fuel tank, invalid transmissions, etc.)
     */
    static async validateAutomotiveConstraints(variant) {
        const result = automotive_validation_rules_1.AutomotiveValidationRules.validateStrict(variant);
        return result;
    }
    /**
     * Enforce source priority when merging variant data from multiple sources (Batch 6 Feature 4)
     * Higher priority source (OEM > Platform > AI) overwrites lower priority
     */
    static mergeVariantWithSourcePriority(existing, incoming, incomingSource, incomingConfidence = 85) {
        const changes = [];
        const merged = { ...existing };
        const incomingPriority = field_source_metadata_1.SourcePriorityMerge.getSourcePriority(incomingSource);
        // Merge top-level fields
        const topLevelFields = [
            'variant_name',
            'ex_showroom_price',
            'expected_price',
            'on_road_price',
            'market_status',
            'trim_name',
            'edition_name',
        ];
        for (const field of topLevelFields) {
            if (!(field in incoming) || incoming[field] === undefined) {
                continue;
            }
            const oldValue = existing[field];
            const newValue = incoming[field];
            // For now, use simple logic: prefer manual edits or higher priority source
            // TODO: store source metadata for each field to enable full source-priority merge
            if (oldValue !== newValue) {
                merged[field] = newValue;
                changes.push({
                    field,
                    oldValue,
                    newValue,
                    reason: `Source: ${incomingSource} (priority ${incomingPriority}, confidence ${incomingConfidence})`,
                });
            }
        }
        // Merge specs with full source metadata tracking
        if (incoming.specs_normalized) {
            const existingMetadata = existing.specs_metadata || {};
            const incomingMetadata = {};
            // Build metadata for incoming specs
            this.flattenSpecs(incoming.specs_normalized, (field, section, value) => {
                const key = `${section}.${field}`;
                incomingMetadata[key] = field_source_metadata_1.MetadataBuilder.fromImportSource(value, incomingSource, incomingConfidence);
            });
            const { merged: mergedSpecs, mergedMetadata, changes: specChanges } = field_source_metadata_1.SourcePriorityMerge.mergeVariantSpecs(this.flattenSpecsToObject(existing.specs_normalized || {}), existingMetadata, this.flattenSpecsToObject(incoming.specs_normalized), incomingMetadata);
            if (specChanges.length > 0) {
                merged.specs_normalized = this.unflattenSpecs(mergedSpecs);
                merged.specs_metadata = mergedMetadata;
                changes.push(...specChanges.map((c) => ({
                    field: `specs.${c.field}`,
                    oldValue: c.old_value,
                    newValue: c.new_value,
                    reason: c.reason,
                })));
            }
        }
        return { merged, changes };
    }
    /**
     * Track changes to variant (Batch 6 Feature 2)
     * Records what changed, who changed it, when, and why
     */
    static async recordVariantChanges(variantId, oldData, newData, changedBy, changeSource = 'manual_edit') {
        const variant = await car_variant_model_1.CarVariant.findOne({ variant_id: variantId });
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        const changes = change_history_1.ChangeHistoryTracker.detectChanges(oldData, newData);
        if (changes.length === 0)
            return;
        const historyEntries = changes.map((c) => change_history_1.ChangeHistoryTracker.createEntry(c.field, c.oldValue, c.newValue, changedBy, changeSource));
        variant.change_history = variant.change_history || [];
        variant.change_history.push(...historyEntries);
        if (variant.change_history.length > 100) {
            variant.change_history = variant.change_history.slice(-100);
        }
        await variant.save();
    }
    /**
     * Track spec changes separately with section info (Batch 6 Feature 2)
     */
    static async recordSpecChanges(variantId, oldSpecs, newSpecs, changedBy, changeSource = 'manual_edit') {
        const variant = await car_variant_model_1.CarVariant.findOne({ variant_id: variantId });
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        const changes = change_history_1.ChangeHistoryTracker.detectSpecChanges(oldSpecs, newSpecs);
        if (changes.length === 0)
            return;
        const historyEntries = changes.map((c) => change_history_1.ChangeHistoryTracker.createSpecEntry(c.field, c.oldValue, c.newValue, changedBy, c.section, changeSource));
        variant.change_history = variant.change_history || [];
        variant.change_history.push(...historyEntries);
        if (variant.change_history.length > 100) {
            variant.change_history = variant.change_history.slice(-100);
        }
        await variant.save();
    }
    /**
     * Get variant change history with optional filtering (Batch 6 Feature 2)
     */
    static async getChangeHistory(variantId, options) {
        const variant = await car_variant_model_1.CarVariant.findOne({ variant_id: variantId }).select('change_history');
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        let history = variant.change_history || [];
        if (options?.field) {
            history = change_history_1.ChangeHistoryTracker.filterChangesByField(history, options.field);
        }
        if (options?.source) {
            history = change_history_1.ChangeHistoryTracker.filterChangesBySource(history, options.source);
        }
        if (options?.startDate && options?.endDate) {
            history = change_history_1.ChangeHistoryTracker.filterChangesByDateRange(history, options.startDate, options.endDate);
        }
        if (options?.limit) {
            history = history.slice(-options.limit);
        }
        return history;
    }
    /**
     * Get audit trail for variant as formatted string
     */
    static async getAuditTrail(variantId) {
        const variant = await car_variant_model_1.CarVariant.findOne({ variant_id: variantId }).select('change_history');
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        const history = variant.change_history || [];
        return change_history_1.ChangeHistoryTracker.auditTrail(history);
    }
    /**
     * Validate variant and return comprehensive validation result (combines integrity + constraints)
     */
    static async comprehensiveValidate(variantId) {
        const variant = await car_variant_model_1.CarVariant.findOne({ variant_id: variantId });
        if (!variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        const automotiveValidation = automotive_validation_rules_1.AutomotiveValidationRules.validateStrict(variant.toObject());
        const changeHistory = variant.change_history || [];
        const lastChange = changeHistory.length > 0 ? changeHistory[changeHistory.length - 1] : null;
        return {
            isValid: automotiveValidation.isValid,
            automotiveErrors: automotiveValidation.errors,
            automotiveWarnings: automotiveValidation.warnings,
            hasSourceMetadata: !!(variant.specs_metadata && Object.keys(variant.specs_metadata).length > 0),
            lastChangedAt: lastChange?.changed_at,
            lastChangedBy: lastChange?.changed_by,
        };
    }
    // Helper methods
    static flattenSpecs(specs, callback) {
        for (const [section, sectionData] of Object.entries(specs)) {
            if (sectionData && typeof sectionData === 'object' && !Array.isArray(sectionData)) {
                for (const [field, value] of Object.entries(sectionData)) {
                    callback(field, section, value);
                }
            }
        }
    }
    static flattenSpecsToObject(specs) {
        const flattened = {};
        this.flattenSpecs(specs, (field, section, value) => {
            flattened[`${section}.${field}`] = value;
        });
        return flattened;
    }
    static unflattenSpecs(flattened) {
        const specs = {};
        for (const [key, value] of Object.entries(flattened)) {
            const [section, ...fieldParts] = key.split('.');
            const field = fieldParts.join('.');
            if (!specs[section])
                specs[section] = {};
            specs[section][field] = value;
        }
        return specs;
    }
}
exports.VariantIntegrityService = VariantIntegrityService;
