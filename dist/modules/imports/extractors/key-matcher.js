"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyMatcher = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const variant_spec_key_model_1 = require("../../../models/variant-spec-key.model");
const spec_key_map_1 = require("../../../modules/variants/utils/spec-key-map");
class KeyMatcher {
    static specKeyCache = null;
    static cacheExpiry = 0;
    static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    static slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    static calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0)
            return 1.0;
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }
    static levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                }
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
                }
            }
        }
        return matrix[str2.length][str1.length];
    }
    static async loadSpecKeys() {
        const now = Date.now();
        if (this.specKeyCache && now < this.cacheExpiry) {
            return this.specKeyCache;
        }
        const keys = await variant_spec_key_model_1.VariantSpecKey.find({
            is_deleted: false,
            is_published: true
        }).lean();
        this.specKeyCache = keys;
        this.cacheExpiry = now + this.CACHE_DURATION;
        return keys;
    }
    static async matchSpecs(extractedSpecs) {
        const specKeys = await this.loadSpecKeys();
        const matched = [];
        const unmatched = [];
        const seenDedupKeys = new Set();
        let duplicateSkippedCount = 0;
        let invalidSkippedCount = 0;
        // Track per-spec debug info
        const debugEntries = [];
        for (const spec of extractedSpecs) {
            // Skip invalid labels
            if ((0, spec_key_map_1.isInvalidLabel)(spec.label)) {
                invalidSkippedCount++;
                continue;
            }
            const normalizedLabel = (0, spec_key_map_1.normalizeLabel)(spec.label);
            const normalizedSlug = this.slugify(spec.label);
            // Dedup by normalized label + value + section (keep first occurrence)
            const dedupKey = `${normalizedLabel}|||${spec.value}|||${spec.section}`;
            if (seenDedupKeys.has(dedupKey)) {
                duplicateSkippedCount++;
                continue;
            }
            seenDedupKeys.add(dedupKey);
            // First, check canonical mapping (SPEC_LABEL_MAP)
            const canonicalMapping = (0, spec_key_map_1.getSpecMapping)(spec.label);
            if (canonicalMapping) {
                const parsedValue = (0, spec_key_map_1.parseSpecValue)(spec.value, canonicalMapping.type);
                const path = canonicalMapping.path || canonicalMapping.rootKey || '';
                debugEntries.push({
                    original_label: spec.label,
                    normalized_label: normalizedLabel,
                    matched_path: path,
                    match_type: 'canonical',
                    confidence: 1.0,
                    final_value: parsedValue,
                });
                matched.push({
                    source_label: spec.label,
                    source_value: parsedValue,
                    matched_key_id: canonicalMapping.key,
                    matched_key_name: canonicalMapping.key,
                    matched_key_slug: canonicalMapping.key,
                    category: canonicalMapping.category,
                    section: spec.section,
                    matchType: 'exact',
                    confidence: 1.0,
                    suggested_path: path,
                });
                continue;
            }
            // Fallback to database matching
            let bestMatch = null;
            let bestMatchType = 'unmatched';
            let bestConfidence = 0;
            for (const key of specKeys) {
                // Exact match on name
                if (normalizedLabel === (0, spec_key_map_1.normalizeLabel)(key.name)) {
                    bestMatch = key;
                    bestMatchType = 'exact';
                    bestConfidence = 1.0;
                    break;
                }
                // Exact match on slug
                if (normalizedSlug === key.slug) {
                    bestMatch = key;
                    bestMatchType = 'exact';
                    bestConfidence = 1.0;
                    break;
                }
                // Alias match
                const normalizedAliases = key.aliases.map(a => (0, spec_key_map_1.normalizeLabel)(a));
                if (normalizedAliases.includes(normalizedLabel)) {
                    bestMatch = key;
                    bestMatchType = 'alias';
                    bestConfidence = 0.95;
                    break;
                }
                // Fuzzy match on name
                const similarity = this.calculateSimilarity(normalizedLabel, (0, spec_key_map_1.normalizeLabel)(key.name));
                if (similarity > bestConfidence && similarity >= 0.75) {
                    bestMatch = key;
                    bestMatchType = similarity >= 0.9 ? 'normalized' : 'fuzzy';
                    bestConfidence = similarity;
                }
            }
            if (bestMatch && bestConfidence >= 0.75) {
                const suggestedPath = this.mapToSpecPath(bestMatch.category, bestMatch.name);
                const matchLabel = bestMatchType === 'exact' ? 'DB-EXACT' : bestMatchType === 'alias' ? 'DB-ALIAS' : 'FUZZY';
                // Parse value based on data_type from database spec key
                const parsedValue = this.parseValueByDataType(spec.value, bestMatch.data_type);
                debugEntries.push({
                    original_label: spec.label,
                    normalized_label: normalizedLabel,
                    matched_path: suggestedPath,
                    match_type: `db-${bestMatchType}`,
                    confidence: bestConfidence,
                    final_value: parsedValue,
                });
                matched.push({
                    source_label: spec.label,
                    source_value: parsedValue,
                    matched_key_id: bestMatch.key_id,
                    matched_key_name: bestMatch.name,
                    matched_key_slug: bestMatch.slug,
                    category: bestMatch.category,
                    section: spec.section,
                    matchType: bestMatchType,
                    confidence: bestConfidence,
                    suggested_path: suggestedPath,
                });
            }
            else {
                const guessedCategory = (0, spec_key_map_1.guessCategory)(spec.label, spec.section);
                debugEntries.push({
                    original_label: spec.label,
                    normalized_label: normalizedLabel,
                    matched_path: undefined,
                    match_type: 'unmatched',
                    confidence: 0,
                    final_value: spec.value,
                });
                unmatched.push({
                    section: spec.section,
                    source_label: spec.label,
                    source_value: spec.value,
                    suggested_slug: normalizedSlug,
                    suggested_category: guessedCategory,
                });
            }
        }
        // Count unique labels (before dedup)
        const uniqueLabels = new Set(extractedSpecs.filter(s => !(0, spec_key_map_1.isInvalidLabel)(s.label)).map(s => (0, spec_key_map_1.normalizeLabel)(s.label)));
        // Count raw (specs_raw path) matched specs
        const rawCount = matched.filter(m => m.suggested_path?.startsWith('specs_raw.')).length;
        const normalizedCount = matched.filter(m => m.suggested_path?.startsWith('specs_normalized.')).length;
        const rootCount = matched.filter(m => m.suggested_path && !m.suggested_path.startsWith('specs_raw.') && !m.suggested_path.startsWith('specs_normalized.')).length;
        // Summary
        const summary = {
            total_extracted_specs: extractedSpecs.length,
            unique_labels: uniqueLabels.size,
            invalid_skipped: invalidSkippedCount,
            duplicate_skipped: duplicateSkippedCount,
            matched_count: matched.length,
            matched_normalized: normalizedCount,
            matched_raw: rawCount,
            matched_root: rootCount,
            unmatched_count: unmatched.length,
            match_types: {
                canonical: matched.filter(m => m.matchType === 'exact' && m.suggested_path && !m.suggested_path.startsWith('specs_raw.')).length,
                'db-exact': matched.filter(m => m.matchType === 'exact' && m.matched_key_id !== m.matched_key_name).length,
                'db-alias': matched.filter(m => m.matchType === 'alias').length,
                fuzzy: matched.filter(m => m.matchType === 'normalized' || m.matchType === 'fuzzy').length,
            },
            unmatched_labels: unmatched.map(u => u.source_label),
        };
        // Write matching results to file
        const logDir = path.resolve(process.cwd(), 'logs', 'imports');
        fs.mkdirSync(logDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const logFile = path.join(logDir, `key-match-${timestamp}.json`);
        fs.writeFileSync(logFile, JSON.stringify({ summary, debug_entries: debugEntries }, null, 2), 'utf-8');
        return { matched, unmatched };
    }
    static mapToSpecPath(category, keyName) {
        // Map category to the nested path in specs_normalized
        const categoryMap = {
            'engine_performance': 'specs_normalized.engine_performance',
            'mileage_range': 'specs_normalized.mileage_range',
            'battery_charging': 'specs_normalized.battery_charging',
            'dimensions_practicality': 'specs_normalized.dimensions_practicality',
            'suspension_steering_brakes': 'specs_normalized.suspension_steering_brakes',
            'tyres_wheels': 'specs_normalized.tyres_wheels',
            'safety': 'specs_normalized.safety',
            'adas': 'specs_normalized.adas',
            'comfort_convenience': 'specs_normalized.comfort_convenience',
            'infotainment_connectivity': 'specs_normalized.infotainment_connectivity',
            'connected_car': 'specs_normalized.connected_car',
            'interior': 'specs_normalized.interior',
            'exterior': 'specs_normalized.exterior',
            'warranty': 'specs_normalized.warranty',
        };
        const basePath = categoryMap[category] || 'specs_normalized';
        const camelCaseKey = this.toCamelCase(keyName);
        return `${basePath}.${camelCaseKey}`;
    }
    static toCamelCase(str) {
        return str
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
            .replace(/^\s/, '');
    }
    static parseValueByDataType(value, dataType) {
        if (!value)
            return null;
        const trimmed = value.trim();
        switch (dataType) {
            case 'boolean': {
                // Mirror parseSpecValue's permissive boolean rules so DB-fallback matches
                // behave identically to canonical SPEC_LABEL_MAP matches.
                return (0, spec_key_map_1.parseSpecValue)(trimmed, 'boolean');
            }
            case 'number': {
                const numMatch = trimmed.match(/[\d.]+/);
                if (numMatch) {
                    const num = parseFloat(numMatch[0]);
                    return isNaN(num) ? null : num;
                }
                return null;
            }
            case 'list': {
                return trimmed
                    .split('|')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
            }
            case 'date': {
                const date = new Date(trimmed);
                return isNaN(date.getTime()) ? null : date;
            }
            case 'string':
            default:
                return trimmed;
        }
    }
    static mapMatchedSpecsToSpecsNormalized(matchedSpecs) {
        const specsNormalized = {};
        const specsRaw = {};
        const additionalFeatures = [];
        for (const matched of matchedSpecs) {
            if (!matched.suggested_path)
                continue;
            const pathParts = matched.suggested_path.split('.');
            // Special handling for additional_features - accumulate as array
            if (pathParts[pathParts.length - 1] === 'additional_features') {
                additionalFeatures.push(matched.source_value);
                continue;
            }
            // Route to specs_raw or specs_normalized based on path prefix
            if (pathParts[0] === 'specs_raw') {
                let current = specsRaw;
                for (let i = 1; i < pathParts.length - 1; i++) {
                    const part = pathParts[i];
                    if (!current[part]) {
                        current[part] = {};
                    }
                    current = current[part];
                }
                const finalKey = pathParts[pathParts.length - 1];
                current[finalKey] = matched.source_value;
            }
            else if (pathParts[0] === 'specs_normalized') {
                let current = specsNormalized;
                for (let i = 1; i < pathParts.length - 1; i++) {
                    const part = pathParts[i];
                    if (!current[part]) {
                        current[part] = {};
                    }
                    current = current[part];
                }
                const finalKey = pathParts[pathParts.length - 1];
                current[finalKey] = matched.source_value;
            }
            else {
                // Root-level field (e.g., transmission_type, drivetrain)
                specsNormalized[pathParts[0]] = matched.source_value;
            }
        }
        // Set accumulated additional_features
        if (additionalFeatures.length > 0) {
            specsRaw.additional_features = additionalFeatures;
            // Derive android_auto / apple_carplay from additional features text
            const allFeaturesText = additionalFeatures.join(' ').toLowerCase();
            if (allFeaturesText.includes('android auto') || allFeaturesText.includes('androidauto')) {
                if (!specsNormalized.infotainment_connectivity)
                    specsNormalized.infotainment_connectivity = {};
                specsNormalized.infotainment_connectivity.android_auto = true;
            }
            if (allFeaturesText.includes('apple carplay') || allFeaturesText.includes('applecarplay')) {
                if (!specsNormalized.infotainment_connectivity)
                    specsNormalized.infotainment_connectivity = {};
                specsNormalized.infotainment_connectivity.apple_carplay = true;
            }
        }
        // Layer 3 — Feature Intelligence. Derived flags power SEO categories,
        // buyer filters, "cars with X" landing pages, and comparison tables.
        // Stored under specs_raw.derived so the variant schema stays untouched.
        const rootFuelType = matchedSpecs.find(m => m.suggested_path === 'fuel_type')?.source_value;
        const rootTransmission = matchedSpecs.find(m => m.suggested_path === 'transmission_type')?.source_value;
        const derived = (0, spec_key_map_1.deriveFeatureFlags)(specsNormalized, specsRaw, {
            fuel_type: typeof rootFuelType === 'string' ? rootFuelType : undefined,
            transmission_type: typeof rootTransmission === 'string' ? rootTransmission : undefined,
        });
        if (Object.keys(derived).length > 0) {
            specsRaw.derived = derived;
        }
        return { specs_normalized: specsNormalized, specs_raw: specsRaw };
    }
    static clearCache() {
        this.specKeyCache = null;
        this.cacheExpiry = 0;
    }
}
exports.KeyMatcher = KeyMatcher;
