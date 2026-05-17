"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnmatchedKeysAnalyticsService = void 0;
const import_log_model_1 = require("../../../models/import-log.model");
class UnmatchedKeysAnalyticsService {
    static async getUnmatchedKeyFrequency(limit = 50) {
        const allLogs = await import_log_model_1.ImportLog.find({
            is_deleted: false,
            'unmatched_data.unmatched': { $exists: true, $ne: [] },
        });
        const frequencyMap = new Map();
        let importsWithUnmatched = 0;
        for (const log of allLogs) {
            if (log.unmatched_data?.unmatched?.length > 0) {
                importsWithUnmatched++;
                const unmatched = log.unmatched_data.unmatched;
                for (const item of unmatched) {
                    const key = this.normalizeKey(item.source_label || item.extracted || '');
                    if (!key)
                        continue;
                    if (!frequencyMap.has(key)) {
                        frequencyMap.set(key, {
                            count: 0,
                            sources: new Map(),
                            sample_values: new Set(),
                        });
                    }
                    const entry = frequencyMap.get(key);
                    entry.count++;
                    entry.sources.set(log.source || 'unknown', (entry.sources.get(log.source || 'unknown') || 0) + 1);
                    if (entry.sample_values.size < 5) {
                        entry.sample_values.add(item.source_value || item.value || '');
                    }
                }
            }
        }
        const frequencyByKey = Array.from(frequencyMap.entries())
            .map(([key, data]) => ({
            key,
            count: data.count,
            sources: Array.from(data.sources.entries()).map(([source, count]) => ({ source, count })),
            sample_values: Array.from(data.sample_values),
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
        return {
            total_imports: await import_log_model_1.ImportLog.countDocuments({ is_deleted: false }),
            imports_with_unmatched: importsWithUnmatched,
            total_unique_unmatched_keys: frequencyMap.size,
            frequency_by_key: frequencyByKey,
        };
    }
    static async getFrequencyBySource(source, limit = 50) {
        const logs = await import_log_model_1.ImportLog.find({
            is_deleted: false,
            source,
            'unmatched_data.unmatched': { $exists: true, $ne: [] },
        });
        const frequencyMap = new Map();
        for (const log of logs) {
            if (log.unmatched_data?.unmatched?.length > 0) {
                const unmatched = log.unmatched_data.unmatched;
                for (const item of unmatched) {
                    const key = this.normalizeKey(item.source_label || item.extracted || '');
                    if (!key)
                        continue;
                    if (!frequencyMap.has(key)) {
                        frequencyMap.set(key, { count: 0, sample_values: new Set() });
                    }
                    const entry = frequencyMap.get(key);
                    entry.count++;
                    if (entry.sample_values.size < 5) {
                        entry.sample_values.add(item.source_value || item.value || '');
                    }
                }
            }
        }
        return Array.from(frequencyMap.entries())
            .map(([key, data]) => ({
            key,
            count: data.count,
            sources: [{ source, count: data.count }],
            sample_values: Array.from(data.sample_values),
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }
    static async getFrequencyByImportType(importType, limit = 50) {
        const logs = await import_log_model_1.ImportLog.find({
            is_deleted: false,
            import_type: importType,
            'unmatched_data.unmatched': { $exists: true, $ne: [] },
        });
        const frequencyMap = new Map();
        for (const log of logs) {
            if (log.unmatched_data?.unmatched?.length > 0) {
                const unmatched = log.unmatched_data.unmatched;
                for (const item of unmatched) {
                    const key = this.normalizeKey(item.source_label || item.extracted || '');
                    if (!key)
                        continue;
                    if (!frequencyMap.has(key)) {
                        frequencyMap.set(key, { count: 0, sample_values: new Set() });
                    }
                    const entry = frequencyMap.get(key);
                    entry.count++;
                    if (entry.sample_values.size < 5) {
                        entry.sample_values.add(item.source_value || item.value || '');
                    }
                }
            }
        }
        return Array.from(frequencyMap.entries())
            .map(([key, data]) => ({
            key,
            count: data.count,
            sources: [{ source: importType, count: data.count }],
            sample_values: Array.from(data.sample_values),
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }
    static normalizeKey(key) {
        if (!key)
            return '';
        return key.toLowerCase().trim().replace(/\s+/g, '_');
    }
}
exports.UnmatchedKeysAnalyticsService = UnmatchedKeysAnalyticsService;
//# sourceMappingURL=unmatched-keys-analytics.service.js.map