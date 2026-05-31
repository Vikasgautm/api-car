"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiSourceVariantService = void 0;
const car_variant_model_1 = require("../../../models/car-variant.model");
const import_log_model_1 = require("../../../models/import-log.model");
const source_priority_config_1 = require("../rules/source-priority-config");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
class MultiSourceVariantService {
    /**
     * Consolidate specs from multiple import logs into a single high-quality variant.
     * Respects source priority for conflicts.
     */
    static async consolidateFromMultipleSources(variant_id) {
        const variant = await car_variant_model_1.CarVariant.findOne({ variant_id, is_deleted: false });
        if (!variant) {
            throw app_error_util_1.AppError.variantNotFound(variant_id);
        }
        const importLogs = await import_log_model_1.ImportLog.find({
            variant_id,
            import_type: 'variant',
            is_deleted: false,
        }).sort({ created_at: -1 });
        const specsBySource = new Map();
        const fieldContributions = new Map();
        for (const log of importLogs) {
            const source = log.source || 'cardekho';
            if (log.matched_data?.specs_normalized) {
                specsBySource.set(source, log.matched_data.specs_normalized);
                this.trackFieldContributions(fieldContributions, log.matched_data.specs_normalized, source, log.import_id, log.createdAt);
            }
        }
        const mergedSpecs = source_priority_config_1.SourcePriorityEngine.mergeSpecsFromMultipleSources(specsBySource);
        const sourceContribution = Array.from(specsBySource.keys()).map((source) => {
            const contributions = Object.entries(fieldContributions)
                .filter(([_, sources]) => sources.some((s) => s.source === source))
                .map(([field]) => field);
            const latestLog = importLogs.find(log => log.source === source);
            return {
                source,
                fields_contributed: contributions,
                last_imported_at: latestLog?.createdAt || new Date(),
                import_id: latestLog?.import_id || '',
            };
        });
        const metadata = {
            variant_id,
            car_id: variant.car_id,
            source_contribution: sourceContribution,
        };
        return { merged_specs: mergedSpecs, metadata };
    }
    /**
     * Track which sources contributed which fields.
     */
    static trackFieldContributions(map, specs, source, import_id, createdAt, prefix = '') {
        for (const key in specs) {
            if (!specs.hasOwnProperty(key))
                continue;
            const value = specs[key];
            const field = prefix ? `${prefix}.${key}` : key;
            if (value === null || value === undefined)
                continue;
            if (typeof value === 'object' && !Array.isArray(value)) {
                this.trackFieldContributions(map, value, source, import_id, createdAt, field);
            }
            else {
                if (!map.has(field)) {
                    map.set(field, []);
                }
                map.get(field).push({ source, import_id, created_at: createdAt });
            }
        }
    }
    /**
     * Apply consolidated specs to a variant while preserving source metadata.
     */
    static async applyConsolidatedSpecs(variant_id, mergedSpecs) {
        await car_variant_model_1.CarVariant.updateOne({ variant_id }, {
            specs_normalized: mergedSpecs,
            // Preserve existing specs_raw and best_for_tags
        });
    }
    /**
     * Get which sources have imported a variant.
     */
    static async getSourceHistory(variant_id) {
        const logs = await import_log_model_1.ImportLog.find({
            variant_id,
            import_type: 'variant',
            is_deleted: false,
        });
        return Array.from(new Set(logs.map(log => log.source || 'cardekho')));
    }
}
exports.MultiSourceVariantService = MultiSourceVariantService;
//# sourceMappingURL=multi-source-variant.service.js.map