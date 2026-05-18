"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnumStandardizerService = void 0;
const body_type_model_1 = require("../../../models/body-type.model");
const fuel_type_model_1 = require("../../../models/fuel-type.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
class EnumStandardizerService {
    /**
     * Standardize a body type string to a valid BodyType ID.
     */
    static async standardizeBodyType(value) {
        if (!value) {
            return {
                field: 'body_type',
                original_value: value,
                standardized_value: null,
                matched_id: null,
                confidence: 0,
            };
        }
        const normalized = value.toLowerCase().trim().replace(/\s+/g, '-');
        // Try exact match first
        let match = await body_type_model_1.BodyType.findOne({
            $or: [
                { slug: normalized },
                { name: { $regex: `^${value}$`, $options: 'i' } },
            ],
            is_deleted: false,
        });
        if (match) {
            return {
                field: 'body_type',
                original_value: value,
                standardized_value: match.name,
                matched_id: match.body_type_id,
                confidence: 1,
            };
        }
        // Try fuzzy match
        match = await body_type_model_1.BodyType.findOne({
            name: { $regex: value, $options: 'i' },
            is_deleted: false,
        });
        if (match) {
            return {
                field: 'body_type',
                original_value: value,
                standardized_value: match.name,
                matched_id: match.body_type_id,
                confidence: 0.85,
            };
        }
        return {
            field: 'body_type',
            original_value: value,
            standardized_value: null,
            matched_id: null,
            confidence: 0,
        };
    }
    /**
     * Standardize a fuel type string to a valid FuelType ID.
     */
    static async standardizeFuelType(value) {
        if (!value) {
            return {
                field: 'fuel_type',
                original_value: value,
                standardized_value: null,
                matched_id: null,
                confidence: 0,
            };
        }
        const normalized = value.toLowerCase().trim().replace(/\s+/g, '-');
        // Try exact match first
        let match = await fuel_type_model_1.FuelType.findOne({
            $or: [
                { slug: normalized },
                { name: { $regex: `^${value}$`, $options: 'i' } },
            ],
            is_deleted: false,
        });
        if (match) {
            return {
                field: 'fuel_type',
                original_value: value,
                standardized_value: match.name,
                matched_id: match.fuel_type_id,
                confidence: 1,
            };
        }
        // Try fuzzy match
        match = await fuel_type_model_1.FuelType.findOne({
            name: { $regex: value, $options: 'i' },
            is_deleted: false,
        });
        if (match) {
            return {
                field: 'fuel_type',
                original_value: value,
                standardized_value: match.name,
                matched_id: match.fuel_type_id,
                confidence: 0.85,
            };
        }
        return {
            field: 'fuel_type',
            original_value: value,
            standardized_value: null,
            matched_id: null,
            confidence: 0,
        };
    }
    /**
     * Standardize a transmission type to valid TransmissionType enum.
     */
    static standardizeTransmissionType(value) {
        const validTypes = [
            'manual',
            'automatic',
            'amt',
            'cvt',
            'dct',
            'dsg',
            'imt',
            'torque_converter',
            'single_speed_ev',
            'e_cvt',
        ];
        if (!value) {
            return {
                field: 'transmission_type',
                original_value: value,
                standardized_value: null,
                matched_id: null,
                confidence: 0,
            };
        }
        const normalized = value.toLowerCase().trim();
        // Exact match
        if (validTypes.includes(normalized)) {
            return {
                field: 'transmission_type',
                original_value: value,
                standardized_value: normalized,
                matched_id: null,
                confidence: 1,
            };
        }
        // Fuzzy matches
        const fuzzyMap = {
            dsg: 'dsg',
            'dual clutch': 'dct',
            'dual-clutch': 'dct',
            imt: 'imt',
            'intelligent manual': 'imt',
            'e-cvt': 'e_cvt',
            ecvt: 'e_cvt',
            'torque converter': 'torque_converter',
            'single speed': 'single_speed_ev',
            'single-speed': 'single_speed_ev',
            'reduction gear': 'single_speed_ev',
            amt: 'amt',
            'automated manual': 'amt',
            cvt: 'cvt',
            'continuously variable': 'cvt',
            manual: 'manual',
            automatic: 'automatic',
            auto: 'automatic',
        };
        for (const [pattern, type] of Object.entries(fuzzyMap)) {
            if (normalized.includes(pattern)) {
                return {
                    field: 'transmission_type',
                    original_value: value,
                    standardized_value: type,
                    matched_id: null,
                    confidence: 0.9,
                };
            }
        }
        return {
            field: 'transmission_type',
            original_value: value,
            standardized_value: null,
            matched_id: null,
            confidence: 0,
        };
    }
    /**
     * Standardize all enum fields in a variant payload.
     */
    static async standardizeVariantEnums(variantData) {
        const results = {};
        if (variantData.body_type) {
            results.body_type = await this.standardizeBodyType(variantData.body_type);
        }
        if (variantData.fuel_type) {
            results.fuel_type = await this.standardizeFuelType(variantData.fuel_type);
        }
        if (variantData.transmission_type) {
            results.transmission_type = this.standardizeTransmissionType(variantData.transmission_type);
        }
        return results;
    }
    /**
     * Get standardization report for recent imports.
     */
    static async getStandardizationReport(limit = 50) {
        const variants = await car_variant_model_1.CarVariant.find({ is_deleted: false })
            .sort({ createdAt: -1 })
            .limit(limit);
        const report = {
            body_type: { total: 0, standardized: 0 },
            fuel_type: { total: 0, standardized: 0 },
            transmission_type: { total: 0, standardized: 0 },
        };
        // Batch fetch all referenced body types and fuel types instead of per-variant lookups
        const bodyTypeIds = new Set(variants.map((v) => v.body_type).filter(Boolean));
        const fuelTypeIds = new Set(variants.map((v) => v.fuel_type_id).filter(Boolean));
        const bodyTypes = await body_type_model_1.BodyType.find({
            body_type_id: { $in: Array.from(bodyTypeIds) },
            is_deleted: false,
        }).lean();
        const fuelTypes = await fuel_type_model_1.FuelType.find({
            fuel_type_id: { $in: Array.from(fuelTypeIds) },
            is_deleted: false,
        }).lean();
        const bodyTypeMap = new Map(bodyTypes.map((bt) => [bt.body_type_id, bt]));
        const fuelTypeMap = new Map(fuelTypes.map((ft) => [ft.fuel_type_id, ft]));
        for (const variant of variants) {
            if (variant.body_type) {
                report.body_type.total++;
                if (bodyTypeMap.has(variant.body_type))
                    report.body_type.standardized++;
            }
            if (variant.fuel_type_id) {
                report.fuel_type.total++;
                if (fuelTypeMap.has(variant.fuel_type_id))
                    report.fuel_type.standardized++;
            }
            if (variant.transmission_type) {
                report.transmission_type.total++;
                report.transmission_type.standardized++;
            }
        }
        const totalChecked = Object.values(report).reduce((sum, r) => sum + r.total, 0);
        const totalStandardized = Object.values(report).reduce((sum, r) => sum + r.standardized, 0);
        const standardizationRate = totalChecked > 0 ? (totalStandardized / totalChecked) * 100 : 0;
        return {
            total_checked: totalChecked,
            standardization_rate: Math.round(standardizationRate * 10) / 10,
            by_field: Object.fromEntries(Object.entries(report).map(([field, data]) => [
                field,
                {
                    total: data.total,
                    standardized: data.standardized,
                    rate: data.total > 0 ? Math.round((data.standardized / data.total) * 100 * 10) / 10 : 0,
                },
            ])),
        };
    }
}
exports.EnumStandardizerService = EnumStandardizerService;
//# sourceMappingURL=enum-standardizer.service.js.map