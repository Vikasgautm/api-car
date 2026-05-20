"use strict";
/**
 * Boolean Normalizer
 * Converts messy yes/no/na/— values to clean true/false/null
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooleanNormalizer = void 0;
class BooleanNormalizer {
    static TRUE_PATTERNS = [
        'yes',
        'y',
        'true',
        't',
        '1',
        'available',
        'present',
        'included',
        'enabled',
        'active',
        'on',
    ];
    static FALSE_PATTERNS = [
        'no',
        'n',
        'false',
        'f',
        '0',
        'na',
        'n/a',
        'not available',
        'not present',
        'not included',
        'disabled',
        'inactive',
        'off',
        '-',
        '–',
        '—',
        'none',
        'null',
        'undefined',
    ];
    /**
     * Normalize a value to boolean or null.
     * Returns null for empty/missing values (not estimated as false).
     */
    static normalize(value) {
        // Null/undefined/empty
        if (value === null || value === undefined || value === '') {
            return {
                value: null,
                is_estimated: false,
                confidence: 1,
                original_value: value,
            };
        }
        // Already boolean
        if (typeof value === 'boolean') {
            return {
                value,
                is_estimated: false,
                confidence: 1,
                original_value: value,
            };
        }
        // Convert to string and normalize
        const stringValue = String(value).toLowerCase().trim();
        // Exact match true
        if (this.TRUE_PATTERNS.includes(stringValue)) {
            return {
                value: true,
                is_estimated: false,
                confidence: 1,
                original_value: value,
            };
        }
        // Exact match false
        if (this.FALSE_PATTERNS.includes(stringValue)) {
            return {
                value: false,
                is_estimated: false,
                confidence: 1,
                original_value: value,
            };
        }
        // Fuzzy matches
        // If value contains "yes" or "available"
        if (stringValue.includes('yes') || stringValue.includes('available') || stringValue.includes('present')) {
            return {
                value: true,
                is_estimated: true,
                confidence: 0.85,
                original_value: value,
            };
        }
        // If value contains "no" or "not" or "na"
        if (stringValue.includes('no ') || stringValue.includes(' no') || stringValue.includes('not') || stringValue.includes('na')) {
            return {
                value: false,
                is_estimated: true,
                confidence: 0.85,
                original_value: value,
            };
        }
        // Numeric: treat anything non-zero as true
        if (!isNaN(Number(stringValue))) {
            const num = Number(stringValue);
            return {
                value: num !== 0,
                is_estimated: true,
                confidence: 0.75,
                original_value: value,
            };
        }
        // Unmapped: return null with zero confidence
        return {
            value: null,
            is_estimated: false,
            confidence: 0,
            original_value: value,
        };
    }
    /**
     * Batch normalize an array of values
     */
    static normalizeBatch(values) {
        return values.map(v => this.normalize(v));
    }
}
exports.BooleanNormalizer = BooleanNormalizer;
//# sourceMappingURL=boolean-normalizer.js.map