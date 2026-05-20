"use strict";
/**
 * String Normalizer
 * Cleans spaces, casing, special characters
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringNormalizer = void 0;
class StringNormalizer {
    /**
     * Normalize a string: lowercase, trim, collapse spaces, remove extra punctuation
     */
    static normalize(value, options) {
        if (!value) {
            return {
                value: '',
                is_valid: false,
                confidence: 0,
                original_value: String(value),
                changes_made: [],
            };
        }
        let stringValue = String(value);
        const changesMade = [];
        const originalValue = stringValue;
        // Trim whitespace
        if (stringValue !== stringValue.trim()) {
            changesMade.push('trimmed_whitespace');
        }
        stringValue = stringValue.trim();
        // Collapse multiple spaces
        if (/\s{2,}/.test(stringValue)) {
            changesMade.push('collapsed_spaces');
            stringValue = stringValue.replace(/\s{2,}/g, ' ');
        }
        // Lowercase (unless preserve_case)
        if (!options?.preserve_case && stringValue !== stringValue.toLowerCase()) {
            changesMade.push('normalized_case');
            stringValue = stringValue.toLowerCase();
        }
        // Remove common junk characters: extra punctuation at start/end
        if (/^[\s\-\.,;:!?]+/.test(stringValue)) {
            changesMade.push('removed_leading_punctuation');
            stringValue = stringValue.replace(/^[\s\-\.,;:!?]+/, '');
        }
        if (/[\s\-\.,;:!?]+$/.test(stringValue)) {
            changesMade.push('removed_trailing_punctuation');
            stringValue = stringValue.replace(/[\s\-\.,;:!?]+$/, '');
        }
        // Confidence: higher if fewer changes
        const confidence = Math.max(0.5, 1 - changesMade.length * 0.1);
        return {
            value: stringValue,
            is_valid: stringValue.length > 0,
            confidence,
            original_value: originalValue,
            changes_made: changesMade,
        };
    }
    /**
     * Normalize for dictionary/semantic lookup: very aggressive
     */
    static normalizeForLookup(value) {
        if (!value)
            return '';
        let stringValue = String(value)
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ') // Collapse spaces
            .replace(/['"'""'']/g, '') // Remove quotes
            .replace(/[\-–—]/g, '-'); // Normalize dashes
        return stringValue;
    }
    /**
     * Extract numeric value from text: "60 kWh" → 60
     */
    static extractNumeric(value) {
        if (!value)
            return null;
        const stringValue = String(value);
        const match = stringValue.match(/(\d+\.?\d*)/);
        return match ? parseFloat(match[1]) : null;
    }
}
exports.StringNormalizer = StringNormalizer;
//# sourceMappingURL=string-normalizer.js.map