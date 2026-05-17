import {
  EV_ONLY_NORMALIZED_PATHS,
  EV_ONLY_RAW_KEYS,
  ICE_ONLY_NORMALIZED_PATHS,
  isElectricFuelType,
  isHybridFuelType,
} from '../rules/fuel-type-field-groups';

export interface SpecValidationError {
  field: string;
  message: string;
}

export interface SpecValidationResult {
  valid: boolean;
  errors: SpecValidationError[];
  warnings: string[];
}

// Checks normalized + raw specs for fuel-type contradictions.
// Hybrids legitimately carry both ICE and EV fields — they skip both checks.
// Non-throwing: returns errors for the caller to decide whether to hard-fail or warn.
export function validateVariantSpecs(params: {
  fuel_type_name?: string;
  specs_normalized?: Record<string, any>;
  specs_raw?: Record<string, any>;
}): SpecValidationResult {
  const errors: SpecValidationError[] = [];
  const warnings: string[] = [];

  const { fuel_type_name, specs_normalized = {}, specs_raw = {} } = params;

  if (!fuel_type_name) return { valid: true, errors, warnings };

  const isEV     = isElectricFuelType(fuel_type_name);
  const isHybrid = isHybridFuelType(fuel_type_name);

  // Hybrids legitimately have both — nothing to validate.
  if (isHybrid) return { valid: true, errors, warnings };

  if (isEV) {
    // Pure EV must not carry ICE-only fields.
    const found: string[] = [];

    for (const { category, key, label } of ICE_ONLY_NORMALIZED_PATHS) {
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
  } else {
    // ICE / CNG / LPG must not carry EV-only fields.
    const found: string[] = [];

    for (const { category, key, label } of EV_ONLY_NORMALIZED_PATHS) {
      if (specs_normalized[category]?.[key] !== undefined) {
        found.push(label);
      }
    }

    for (const { key, label } of EV_ONLY_RAW_KEYS) {
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
