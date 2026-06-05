import { ValidationIssue } from '../models/VariantImportStaging';

const VALID_FUEL_TYPES = ['petrol', 'diesel', 'electric', 'ev', 'hybrid', 'cng', 'lpg', 'cng + petrol'];
const VALID_TRANSMISSIONS = ['manual', 'automatic', 'amt', 'cvt', 'dct', 'dsg', 'imt', 'torque_converter', 'single_speed_ev', 'e_cvt'];

interface VariantInput {
  variant_name?: string;
  source_car_name?: string;
  price?: number;
  fuel_type?: string;
  transmission?: string;
  raw_specs?: Record<string, any>;
  normalized_specs?: Record<string, any>;
}

export class VariantImportValidator {
  static validate(input: VariantInput, validFuelTypeNames?: string[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Required fields
    if (!input.variant_name || !input.variant_name.trim()) {
      issues.push({ field: 'variant_name', message: 'Variant name is required', severity: 'error' });
    }

    if (!input.source_car_name || !input.source_car_name.trim()) {
      issues.push({ field: 'source_car_name', message: 'Source car name is required', severity: 'error' });
    }

    // Price validation
    if (input.price !== undefined) {
      if (typeof input.price !== 'number' || isNaN(input.price)) {
        issues.push({ field: 'price', message: 'Price must be a valid number', severity: 'error' });
      } else if (input.price < 0) {
        issues.push({ field: 'price', message: 'Price cannot be negative', severity: 'error' });
      } else if (input.price > 0 && input.price < 10000) {
        issues.push({ field: 'price', message: 'Price appears too low — verify units (expected rupees)', severity: 'warning' });
      } else if (input.price > 100000000) {
        issues.push({ field: 'price', message: 'Price exceeds ₹10 Cr — verify the value', severity: 'warning' });
      }
    } else {
      issues.push({ field: 'price', message: 'Price is missing', severity: 'warning' });
    }

    // Fuel type validation — use live master data names when provided, fall back to hardcoded list
    if (!input.fuel_type) {
      issues.push({ field: 'fuel_type', message: 'Fuel type is missing', severity: 'warning' });
    } else {
      const normalized = input.fuel_type.toLowerCase().trim();
      const fuelTypes = validFuelTypeNames?.length
        ? validFuelTypeNames.map(f => f.toLowerCase())
        : VALID_FUEL_TYPES;
      if (!fuelTypes.some(f => normalized.includes(f))) {
        issues.push({ field: 'fuel_type', message: `Fuel type "${input.fuel_type}" is not recognised`, severity: 'error' });
      }
    }

    // Transmission validation
    if (!input.transmission) {
      issues.push({ field: 'transmission', message: 'Transmission type is missing', severity: 'warning' });
    } else {
      const normalized = input.transmission.toLowerCase().replace(/\s+/g, '_').trim();
      if (!VALID_TRANSMISSIONS.some(t => normalized.includes(t))) {
        issues.push({ field: 'transmission', message: `Transmission "${input.transmission}" is not recognised`, severity: 'error' });
      }
    }

    // Specs validation
    const specs = input.normalized_specs || input.raw_specs || {};
    this.validateSpecs(specs, issues);

    return issues;
  }

  private static validateSpecs(specs: Record<string, any>, issues: ValidationIssue[]): void {
    // Mileage checks
    const mileage = specs.mileage || specs.arai_mileage;
    if (mileage !== undefined) {
      const val = parseFloat(String(mileage));
      if (!isNaN(val)) {
        if (val < 0) issues.push({ field: 'mileage', message: 'Mileage cannot be negative', severity: 'error' });
        else if (val > 100) issues.push({ field: 'mileage', message: `Mileage of ${val} kmpl seems unrealistic`, severity: 'warning' });
      }
    }

    // Fuel/powertrain conflict: EV should not have mileage in kmpl
    const fuelType = String(specs.fuel_type || '').toLowerCase();
    if ((fuelType.includes('electric') || fuelType.includes('ev')) && mileage) {
      issues.push({ field: 'fuel_type', message: 'Electric variants should use range (km) not mileage (kmpl)', severity: 'warning' });
    }

    // Engine displacement vs fuel type conflict
    const displacement = specs.displacement || specs.engine_displacement;
    if (displacement) {
      const val = parseFloat(String(displacement));
      if (!isNaN(val) && val > 0 && (fuelType.includes('electric') || fuelType.includes('ev'))) {
        issues.push({ field: 'displacement', message: 'Electric variants should not have engine displacement', severity: 'warning' });
      }
    }

    // Power sanity check
    const power = specs.max_power || specs.power;
    if (power !== undefined) {
      const val = parseFloat(String(power));
      if (!isNaN(val)) {
        if (val <= 0) issues.push({ field: 'max_power', message: 'Power must be positive', severity: 'error' });
        else if (val > 2000) issues.push({ field: 'max_power', message: `Power value ${val} bhp seems unrealistic`, severity: 'warning' });
      }
    }

    // Seating capacity check
    const seats = specs.seating_capacity;
    if (seats !== undefined) {
      const val = parseInt(String(seats));
      if (!isNaN(val) && (val < 1 || val > 14)) {
        issues.push({ field: 'seating_capacity', message: `Seating capacity of ${val} is unusual`, severity: 'warning' });
      }
    }
  }

  static hasErrors(issues: ValidationIssue[]): boolean {
    return issues.some(i => i.severity === 'error');
  }
}
