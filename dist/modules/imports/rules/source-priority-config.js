"use strict";
// ─── SOURCE PRIORITY ENGINE ───────────────────────────────────────────────────
// Defines source reliability weights and field-level trust scores.
// When specs come from multiple sources, this determines which takes precedence.
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourcePriorityEngine = exports.FIELD_SOURCE_TRUST = exports.SOURCE_PRIORITIES = void 0;
exports.SOURCE_PRIORITIES = [
    {
        source: 'oem_brochure',
        priority: 100,
        category: 'official',
    },
    {
        source: 'official_website',
        priority: 95,
        category: 'official',
    },
    {
        source: 'cardekho',
        priority: 70,
        category: 'aggregator',
    },
    {
        source: 'carwale',
        priority: 65,
        category: 'aggregator',
    },
];
// Field-specific trust overrides (rare; most fields follow general source priority)
exports.FIELD_SOURCE_TRUST = [
    {
        field: 'specs_normalized.safety.ncap_rating',
        trusted_sources: ['oem_brochure', 'official_website', 'cardekho', 'carwale'],
    },
    {
        field: 'specs_normalized.engine_performance.max_power',
        trusted_sources: ['oem_brochure', 'official_website', 'cardekho', 'carwale'],
    },
    {
        field: 'specs_normalized.battery_charging.battery_capacity',
        trusted_sources: ['oem_brochure', 'official_website', 'cardekho', 'carwale'],
    },
];
class SourcePriorityEngine {
    static getPriorityForSource(source) {
        const priority = exports.SOURCE_PRIORITIES.find(s => s.source === source);
        return priority?.priority ?? 0;
    }
    static getHighestPrioritySource(...sources) {
        return sources.sort((a, b) => this.getPriorityForSource(b) - this.getPriorityForSource(a))[0];
    }
    static shouldUseSourceForField(source, field) {
        const fieldTrust = exports.FIELD_SOURCE_TRUST.find(f => f.field === field);
        if (fieldTrust) {
            return fieldTrust.trusted_sources.includes(source);
        }
        return true; // Default: use general source priority
    }
    static getTrustedSourcesForField(field) {
        const fieldTrust = exports.FIELD_SOURCE_TRUST.find(f => f.field === field);
        if (fieldTrust) {
            return fieldTrust.trusted_sources;
        }
        // Default: return all sources in priority order
        return exports.SOURCE_PRIORITIES.map(s => s.source);
    }
    static mergeSpecsFromMultipleSources(specsBySource) {
        const merged = {};
        // For each source in priority order, fill gaps
        const prioritizedSources = Array.from(specsBySource.keys()).sort((a, b) => this.getPriorityForSource(b) - this.getPriorityForSource(a));
        for (const source of prioritizedSources) {
            const specs = specsBySource.get(source) || {};
            this.deepMergeSpecs(merged, specs, source);
        }
        return merged;
    }
    static deepMergeSpecs(target, source, sourceType) {
        if (!source || typeof source !== 'object')
            return;
        for (const key in source) {
            if (!source.hasOwnProperty(key))
                continue;
            const sourceValue = source[key];
            const targetValue = target[key];
            if (typeof sourceValue === 'object' && sourceValue !== null && !Array.isArray(sourceValue)) {
                if (typeof targetValue !== 'object' || targetValue === null || Array.isArray(targetValue)) {
                    target[key] = {};
                }
                this.deepMergeSpecs(target[key], sourceValue, sourceType);
            }
            else if (sourceValue !== null && sourceValue !== undefined) {
                // Only fill gaps; higher priority sources already placed their values
                if (targetValue === null || targetValue === undefined) {
                    target[key] = sourceValue;
                }
            }
        }
    }
}
exports.SourcePriorityEngine = SourcePriorityEngine;
