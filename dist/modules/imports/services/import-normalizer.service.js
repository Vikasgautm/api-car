"use strict";
/**
 * Import Normalizer Service
 * Orchestrates normalization of raw imported specs_raw into clean specs_normalized
 *
 * Flow:
 * 1. Accepts specs_raw (messy imported data)
 * 2. Cleans strings (spaces, casing, punctuation)
 * 3. Normalizes booleans (yes/no/na → true/false/null)
 * 4. Maps semantic names (synonyms → canonical keys)
 * 5. Extracts numbers from formatted text ("60 kWh" → 60)
 * 6. Returns specs_normalized with confidence scores
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportNormalizerService = void 0;
const boolean_normalizer_1 = require("../normalizers/boolean-normalizer");
const string_normalizer_1 = require("../normalizers/string-normalizer");
const semantic_normalizer_1 = require("../normalizers/semantic-normalizer");
class ImportNormalizerService {
    /**
     * Normalize all specs from a raw import
     */
    static normalize(specs_raw = {}) {
        const mappingDetails = {};
        const unmappedKeys = [];
        let mappedCount = 0;
        let unmappedCount = 0;
        let estimatedCount = 0;
        const specs_normalized = {};
        // Process each field in raw specs
        for (const [rawKey, rawValue] of Object.entries(specs_raw)) {
            const normalized = this.normalizeField(rawKey, rawValue);
            if (normalized.success && normalized.path) {
                mappedCount++;
                // Store normalized value
                const [category, fieldKey] = normalized.path;
                if (!specs_normalized[category]) {
                    specs_normalized[category] = {};
                }
                const categoryObj = specs_normalized[category];
                categoryObj[fieldKey] = normalized.value;
                mappingDetails[rawKey] = {
                    original: rawValue,
                    normalized: normalized.value,
                    confidence: normalized.confidence,
                    is_estimated: normalized.is_estimated,
                    canonical_key: normalized.canonical_key,
                };
                if (normalized.is_estimated) {
                    estimatedCount++;
                }
            }
            else {
                unmappedCount++;
                unmappedKeys.push({
                    key: rawKey,
                    raw_value: rawValue,
                    attempted_mapping: normalized.attempted_mapping,
                });
            }
        }
        const totalProcessed = mappedCount + unmappedCount;
        const overallConfidence = totalProcessed > 0 ? mappedCount / totalProcessed : 0;
        return {
            specs_normalized,
            normalization_stats: {
                total_fields_processed: totalProcessed,
                mapped_fields: mappedCount,
                unmapped_fields: unmappedCount,
                estimated_fields: estimatedCount,
                overall_confidence: overallConfidence,
            },
            unmapped_keys: unmappedKeys,
            mapping_details: mappingDetails,
        };
    }
    /**
     * Normalize a single field
     * Returns: { success, value, confidence, is_estimated, path, canonical_key, attempted_mapping }
     */
    static normalizeField(rawKey, rawValue) {
        // Try semantic mapping first (feature names)
        const semanticResult = semantic_normalizer_1.SemanticNormalizer.normalize(rawKey);
        if (semanticResult.is_mapped) {
            // Semantic match: field is a feature name like "Wireless Charger"
            const normalizedValue = this.normalizeValueForType(rawValue, 'boolean');
            return {
                success: true,
                value: normalizedValue.value,
                confidence: semanticResult.confidence * normalizedValue.confidence,
                is_estimated: normalizedValue.is_estimated,
                path: [semanticResult.category, semanticResult.canonical_key],
                canonical_key: semanticResult.canonical_key,
            };
        }
        // Try direct key mapping (numeric specs)
        const directMapping = this.mapRawKeyToNormalized(rawKey);
        if (directMapping) {
            const normalizedValue = this.normalizeValueForType(rawValue, directMapping.type);
            return {
                success: true,
                value: normalizedValue.value,
                confidence: normalizedValue.confidence,
                is_estimated: normalizedValue.is_estimated,
                path: [directMapping.category, directMapping.key],
            };
        }
        // Unmapped
        return {
            success: false,
            attempted_mapping: `could not map "${rawKey}" to any known field`,
        };
    }
    /**
     * Map raw key names to normalized field path
     * E.g. "engine_displacement_cc" → { category: "engine_performance", key: "displacement" }
     */
    static mapRawKeyToNormalized(rawKey) {
        // Normalize the key for matching
        const normalized = string_normalizer_1.StringNormalizer.normalizeForLookup(rawKey);
        // Direct mappings from common raw field names
        const mappings = {
            // Engine & Performance (underscore keys)
            engine_displacement_cc: { category: 'engine_performance', key: 'displacement', type: 'string' },
            displacement_cc: { category: 'engine_performance', key: 'displacement', type: 'string' },
            engine_displacement: { category: 'engine_performance', key: 'displacement', type: 'string' },
            displacement: { category: 'engine_performance', key: 'displacement', type: 'string' },
            max_power_bhp: { category: 'engine_performance', key: 'max_power', type: 'string' },
            power_bhp: { category: 'engine_performance', key: 'max_power', type: 'string' },
            max_power: { category: 'engine_performance', key: 'max_power', type: 'string' },
            max_torque_nm: { category: 'engine_performance', key: 'max_torque', type: 'string' },
            torque_nm: { category: 'engine_performance', key: 'max_torque', type: 'string' },
            max_torque: { category: 'engine_performance', key: 'max_torque', type: 'string' },
            cylinders: { category: 'engine_performance', key: 'cylinders', type: 'number' },
            valves_per_cylinder: { category: 'engine_performance', key: 'valves_per_cylinder', type: 'number' },
            turbocharger: { category: 'engine_performance', key: 'turbocharger', type: 'boolean' },
            supercharger: { category: 'engine_performance', key: 'supercharger', type: 'boolean' },
            // Engine & Performance (space-based keys from CarDekho/human-readable sources)
            'engine displacement': { category: 'engine_performance', key: 'displacement', type: 'string' },
            'engine displacement cc': { category: 'engine_performance', key: 'displacement', type: 'string' },
            'max power': { category: 'engine_performance', key: 'max_power', type: 'string' },
            'max torque': { category: 'engine_performance', key: 'max_torque', type: 'string' },
            'no of cylinders': { category: 'engine_performance', key: 'cylinders', type: 'number' },
            'number of cylinders': { category: 'engine_performance', key: 'cylinders', type: 'number' },
            'valves per cylinder': { category: 'engine_performance', key: 'valves_per_cylinder', type: 'number' },
            // Mileage & Range
            arai_mileage_kmpl: { category: 'mileage_range', key: 'arai_mileage', type: 'string' },
            city_mileage_kmpl: { category: 'mileage_range', key: 'city_mileage', type: 'string' },
            highway_mileage_kmpl: { category: 'mileage_range', key: 'highway_mileage', type: 'string' },
            fuel_tank_capacity_l: { category: 'mileage_range', key: 'fuel_tank_capacity', type: 'string' },
            'arai mileage': { category: 'mileage_range', key: 'arai_mileage', type: 'string' },
            'city mileage': { category: 'mileage_range', key: 'city_mileage', type: 'string' },
            'fuel tank capacity': { category: 'mileage_range', key: 'fuel_tank_capacity', type: 'string' },
            // Battery & Charging
            battery_capacity_kwh: { category: 'battery_charging', key: 'battery_capacity_kwh', type: 'number' },
            battery_capacity: { category: 'battery_charging', key: 'battery_capacity', type: 'string' },
            motor_power_kw: { category: 'battery_charging', key: 'motor_power_kw', type: 'string' },
            motor_torque_nm: { category: 'battery_charging', key: 'motor_torque_nm', type: 'string' },
            'battery capacity': { category: 'battery_charging', key: 'battery_capacity', type: 'string' },
            'motor power': { category: 'battery_charging', key: 'motor_power_kw', type: 'string' },
            // Dimensions
            length_mm: { category: 'dimensions_practicality', key: 'length', type: 'string' },
            width_mm: { category: 'dimensions_practicality', key: 'width', type: 'string' },
            height_mm: { category: 'dimensions_practicality', key: 'height', type: 'string' },
            wheelbase_mm: { category: 'dimensions_practicality', key: 'wheelbase', type: 'string' },
            ground_clearance_mm: { category: 'dimensions_practicality', key: 'ground_clearance', type: 'string' },
            boot_space_l: { category: 'dimensions_practicality', key: 'boot_space', type: 'string' },
            seating_capacity: { category: 'dimensions_practicality', key: 'seating_capacity', type: 'number' },
            'ground clearance': { category: 'dimensions_practicality', key: 'ground_clearance', type: 'string' },
            'boot space': { category: 'dimensions_practicality', key: 'boot_space', type: 'string' },
            'seating capacity': { category: 'dimensions_practicality', key: 'seating_capacity', type: 'number' },
            // Safety
            airbags: { category: 'safety', key: 'airbags', type: 'number' },
            ncap_rating: { category: 'safety', key: 'ncap_rating', type: 'number' },
            'number of airbags': { category: 'safety', key: 'airbags', type: 'number' },
            'ncap rating': { category: 'safety', key: 'ncap_rating', type: 'number' },
            'global ncap rating': { category: 'safety', key: 'ncap_rating', type: 'number' },
            // Comfort & Convenience
            wireless_charger: { category: 'comfort_convenience', key: 'wireless_charger', type: 'boolean' },
            'wireless charger': { category: 'comfort_convenience', key: 'wireless_charger', type: 'boolean' },
            wireless_charging: { category: 'comfort_convenience', key: 'wireless_charger', type: 'boolean' },
            'wireless charging': { category: 'comfort_convenience', key: 'wireless_charger', type: 'boolean' },
            sunroof: { category: 'comfort_convenience', key: 'sunroof', type: 'boolean' },
            panoramic_sunroof: { category: 'comfort_convenience', key: 'panoramic_sunroof', type: 'boolean' },
            'panoramic sunroof': { category: 'comfort_convenience', key: 'panoramic_sunroof', type: 'boolean' },
            ventilated_seats: { category: 'comfort_convenience', key: 'ventilated_seats', type: 'boolean' },
            'ventilated seats': { category: 'comfort_convenience', key: 'ventilated_seats', type: 'boolean' },
            // Tyres & Wheels
            tyre_size: { category: 'tyres_wheels', key: 'tyre_size', type: 'string' },
            wheel_size: { category: 'tyres_wheels', key: 'wheel_size', type: 'string' },
            'tyre size': { category: 'tyres_wheels', key: 'tyre_size', type: 'string' },
            'wheel size': { category: 'tyres_wheels', key: 'wheel_size', type: 'string' },
        };
        return mappings[normalized] || null;
    }
    /**
     * Normalize a value based on its expected type
     */
    static normalizeValueForType(value, type) {
        if (type === 'boolean') {
            const result = boolean_normalizer_1.BooleanNormalizer.normalize(value);
            return {
                value: result.value,
                confidence: result.confidence,
                is_estimated: result.is_estimated,
            };
        }
        if (type === 'number') {
            const numeric = string_normalizer_1.StringNormalizer.extractNumeric(value);
            if (numeric !== null) {
                return {
                    value: numeric,
                    confidence: 1,
                    is_estimated: false,
                };
            }
            return {
                value: null,
                confidence: 0,
                is_estimated: false,
            };
        }
        if (type === 'string') {
            const result = string_normalizer_1.StringNormalizer.normalize(value);
            return {
                value: result.is_valid ? result.value : null,
                confidence: result.confidence,
                is_estimated: result.changes_made.length > 1,
            };
        }
        return {
            value: value,
            confidence: 0.5,
            is_estimated: false,
        };
    }
}
exports.ImportNormalizerService = ImportNormalizerService;
//# sourceMappingURL=import-normalizer.service.js.map