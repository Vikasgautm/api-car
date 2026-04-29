"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyMatcher = void 0;
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
        const seenLabels = new Set();
        for (const spec of extractedSpecs) {
            // Skip invalid labels
            if ((0, spec_key_map_1.isInvalidLabel)(spec.label)) {
                continue;
            }
            // Skip duplicate labels
            const normalizedLabel = (0, spec_key_map_1.normalizeLabel)(spec.label);
            if (seenLabels.has(normalizedLabel)) {
                continue;
            }
            seenLabels.add(normalizedLabel);
            const normalizedSlug = this.slugify(spec.label);
            // First, check canonical mapping
            const canonicalMapping = (0, spec_key_map_1.getSpecMapping)(spec.label);
            if (canonicalMapping) {
                // Use canonical mapping - highest priority
                const parsedValue = (0, spec_key_map_1.parseSpecValue)(spec.value, canonicalMapping.type);
                matched.push({
                    source_label: spec.label,
                    source_value: spec.value,
                    matched_key_id: canonicalMapping.key,
                    matched_key_name: canonicalMapping.key,
                    matched_key_slug: canonicalMapping.key,
                    category: canonicalMapping.category,
                    section: spec.section,
                    matchType: 'exact',
                    confidence: 1.0,
                    suggested_path: canonicalMapping.path || canonicalMapping.rootKey,
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
                matched.push({
                    source_label: spec.label,
                    source_value: spec.value,
                    matched_key_id: bestMatch.key_id,
                    matched_key_name: bestMatch.name,
                    matched_key_slug: bestMatch.slug,
                    category: bestMatch.category,
                    section: spec.section,
                    matchType: bestMatchType,
                    confidence: bestConfidence,
                    suggested_path: this.mapToSpecPath(bestMatch.category, bestMatch.name),
                });
            }
            else {
                unmatched.push({
                    section: spec.section,
                    source_label: spec.label,
                    source_value: spec.value,
                    suggested_slug: normalizedSlug,
                    suggested_category: this.guessCategory(spec.label, spec.section),
                });
            }
        }
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
    static guessCategory(label, section) {
        const lowerLabel = label.toLowerCase();
        const lowerSection = section.toLowerCase();
        // Engine & Transmission
        if (lowerLabel.includes('engine') || lowerLabel.includes('motor') ||
            lowerLabel.includes('power') || lowerLabel.includes('torque') ||
            lowerLabel.includes('displacement') || lowerLabel.includes('cylinder')) {
            return 'engine_performance';
        }
        // Battery & Charging
        if (lowerLabel.includes('battery') || lowerLabel.includes('charging') ||
            lowerLabel.includes('range') || lowerLabel.includes('kwh')) {
            return 'battery_charging';
        }
        // Dimensions
        if (lowerLabel.includes('length') || lowerLabel.includes('width') ||
            lowerLabel.includes('height') || lowerLabel.includes('wheelbase') ||
            lowerLabel.includes('boot') || lowerLabel.includes('ground clearance')) {
            return 'dimensions_practicality';
        }
        // Safety
        if (lowerLabel.includes('airbag') || lowerLabel.includes('abs') ||
            lowerLabel.includes('brake') || lowerLabel.includes('safety') ||
            lowerLabel.includes('ncap')) {
            return 'safety';
        }
        // Suspension & Steering
        if (lowerLabel.includes('suspension') || lowerLabel.includes('steering')) {
            return 'suspension_steering_brakes';
        }
        // Tyres
        if (lowerLabel.includes('tyre') || lowerLabel.includes('wheel') || lowerLabel.includes('rim')) {
            return 'tyres_wheels';
        }
        // Mileage
        if (lowerLabel.includes('mileage') || lowerLabel.includes('fuel tank')) {
            return 'mileage_range';
        }
        // ADAS
        if (lowerLabel.includes('adaptive') || lowerLabel.includes('lane') ||
            lowerLabel.includes('collision') || lowerLabel.includes('cruise')) {
            return 'adas';
        }
        // Infotainment
        if (lowerLabel.includes('screen') || lowerLabel.includes('display') ||
            lowerLabel.includes('bluetooth') || lowerLabel.includes('speaker') ||
            lowerLabel.includes('android') || lowerLabel.includes('apple')) {
            return 'infotainment_connectivity';
        }
        // Comfort
        if (lowerLabel.includes('ac') || lowerLabel.includes('seat') ||
            lowerLabel.includes('climate') || lowerLabel.includes('sunroof')) {
            return 'comfort_convenience';
        }
        // Interior
        if (lowerLabel.includes('dashboard') || lowerLabel.includes('interior') ||
            lowerLabel.includes('upholstery')) {
            return 'interior';
        }
        // Exterior
        if (lowerLabel.includes('headlight') || lowerLabel.includes('tail light') ||
            lowerLabel.includes('fog') || lowerLabel.includes('mirror')) {
            return 'exterior';
        }
        // Warranty
        if (lowerLabel.includes('warranty')) {
            return 'warranty';
        }
        // Default based on section
        if (lowerSection.includes('engine') || lowerSection.includes('transmission')) {
            return 'engine_performance';
        }
        if (lowerSection.includes('dimension')) {
            return 'dimensions_practicality';
        }
        if (lowerSection.includes('safety')) {
            return 'safety';
        }
        return 'dimensions_practicality'; // Default
    }
    static mapMatchedSpecsToSpecsNormalized(matchedSpecs) {
        const specs = {};
        for (const matched of matchedSpecs) {
            if (!matched.suggested_path)
                continue;
            const pathParts = matched.suggested_path.split('.');
            let current = specs;
            for (let i = 0; i < pathParts.length - 1; i++) {
                const part = pathParts[i];
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }
            const finalKey = pathParts[pathParts.length - 1];
            current[finalKey] = matched.source_value;
        }
        return specs;
    }
    static clearCache() {
        this.specKeyCache = null;
        this.cacheExpiry = 0;
    }
}
exports.KeyMatcher = KeyMatcher;
//# sourceMappingURL=key-matcher.js.map