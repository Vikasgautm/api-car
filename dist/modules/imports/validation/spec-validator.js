"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateVariantSpecs = validateVariantSpecs;
const fuel_type_field_groups_1 = require("../rules/fuel-type-field-groups");
// Checks normalized + raw specs for fuel-type contradictions.
// Hybrids legitimately carry both ICE and EV fields — they skip both checks.
// Non-throwing: returns errors for the caller to decide whether to hard-fail or warn.
function validateVariantSpecs(params) {
    const errors = [];
    const warnings = [];
    const { fuel_type_name, specs_normalized = {}, specs_raw = {} } = params;
    if (!fuel_type_name)
        return { valid: true, errors, warnings };
    const isEV = (0, fuel_type_field_groups_1.isElectricFuelType)(fuel_type_name);
    const isHybrid = (0, fuel_type_field_groups_1.isHybridFuelType)(fuel_type_name);
    // Hybrids legitimately have both — nothing to validate.
    if (isHybrid)
        return { valid: true, errors, warnings };
    if (isEV) {
        // Pure EV must not carry ICE-only fields.
        const found = [];
        for (const { category, key, label } of fuel_type_field_groups_1.ICE_ONLY_NORMALIZED_PATHS) {
            if (specs_normalized[category]?.[key] !== undefined) {
                found.push(label);
            }
        }
        if (found.length > 0) {
            errors.push({
                field: 'specs_normalized',
                message: `Electric vehicle cannot have ICE-only fields: ${found.join(', ')}`,
            });
        }
    }
    else {
        // ICE / CNG / LPG must not carry EV-only fields.
        const found = [];
        for (const { category, key, label } of fuel_type_field_groups_1.EV_ONLY_NORMALIZED_PATHS) {
            if (specs_normalized[category]?.[key] !== undefined) {
                found.push(label);
            }
        }
        for (const { key, label } of fuel_type_field_groups_1.EV_ONLY_RAW_KEYS) {
            if (specs_raw[key] !== undefined) {
                found.push(label);
            }
        }
        if (found.length > 0) {
            errors.push({
                field: 'specs_normalized',
                message: `${fuel_type_name} vehicle cannot have EV-only fields: ${found.join(', ')}`,
            });
        }
    }
    return { valid: errors.length === 0, errors, warnings };
}
//# sourceMappingURL=spec-validator.js.map