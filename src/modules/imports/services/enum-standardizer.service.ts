import { BodyType } from '../../../models/body-type.model';
import { FuelType } from '../../../models/fuel-type.model';
import { CarVariant } from '../../../models/car-variant.model';
import { MasterDataService } from '../../master-data/services/master-data.service';

// Master-data-backed single-value fields
const MASTER_SINGLE_FIELDS: Record<string, string> = {
  transmission_type: 'transmission',
  drivetrain: 'drive_type',
  gearbox: 'gearbox',
  sunroof_type: 'sunroof_type',
  parking_sensor: 'parking_sensor',
  headlamp_type: 'headlamp_type',
  seat_upholstery: 'seat_upholstery',
  instrument_cluster: 'instrument_cluster',
  battery_type: 'battery_type',
  battery_cooling: 'battery_cooling',
  charging_port: 'charging_port',
};

// Master-data-backed multi-value fields
const MASTER_MULTI_FIELDS: Record<string, string> = {
  drive_modes: 'drive_modes',
  terrain_modes: 'terrain_modes',
  charging_options: 'charging_options',
};

export interface EnumStandardizationResult {
  field: string;
  original_value: string;
  standardized_value: string | null;
  matched_id: string | null;
  confidence: number; // 0-1
}

export class EnumStandardizerService {
  /**
   * Standardize a body type string to a valid BodyType ID.
   */
  static async standardizeBodyType(value: string): Promise<EnumStandardizationResult> {
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
    let match = await BodyType.findOne({
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
    match = await BodyType.findOne({
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
  static async standardizeFuelType(value: string): Promise<EnumStandardizationResult> {
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
    let match = await FuelType.findOne({
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
    match = await FuelType.findOne({
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
   * Resolve a single-value field against the master data DB.
   * Logs unknown values for admin review. Falls back to 'other'.
   */
  static async standardizeMasterField(
    field: string,
    categoryKey: string,
    rawValue: string,
    context?: string,
  ): Promise<EnumStandardizationResult> {
    if (!rawValue) {
      return { field, original_value: rawValue, standardized_value: null, matched_id: null, confidence: 0 };
    }

    const resolved = await MasterDataService.resolveDropdownImport(categoryKey, rawValue);
    if (!resolved || resolved === 'other') {
      await MasterDataService.logUnknownValue(categoryKey, rawValue, context);
      return { field, original_value: rawValue, standardized_value: 'other', matched_id: null, confidence: 0.1 };
    }

    return { field, original_value: rawValue, standardized_value: resolved, matched_id: null, confidence: 0.95 };
  }

  /**
   * Resolve a multi-value field against the master data DB.
   * Each unmatched value is logged. Unknown values map to 'other'.
   */
  static async standardizeMasterMultiField(
    field: string,
    categoryKey: string,
    rawValue: any,
    context?: string,
  ): Promise<string[]> {
    const raw = MasterDataService.normalizeMultiSelectImport(rawValue);
    const results: string[] = [];
    for (const item of raw) {
      const resolved = await MasterDataService.resolveDropdownImport(categoryKey, item);
      if (!resolved || resolved === 'other') {
        await MasterDataService.logUnknownValue(categoryKey, item, context);
        if (!results.includes('other')) results.push('other');
      } else {
        if (!results.includes(resolved)) results.push(resolved);
      }
    }
    return results;
  }

  /**
   * Standardize all enum fields in a variant payload.
   */
  static async standardizeVariantEnums(
    variantData: Record<string, any>,
    context?: string,
  ): Promise<Record<string, EnumStandardizationResult>> {
    const results: Record<string, EnumStandardizationResult> = {};

    if (variantData.body_type) {
      results.body_type = await this.standardizeBodyType(variantData.body_type);
    }

    if (variantData.fuel_type) {
      results.fuel_type = await this.standardizeFuelType(variantData.fuel_type);
    }

    // All master-data-backed single-value fields
    for (const [field, categoryKey] of Object.entries(MASTER_SINGLE_FIELDS)) {
      if (variantData[field]) {
        results[field] = await this.standardizeMasterField(field, categoryKey, variantData[field], context);
      }
    }

    return results;
  }

  /**
   * Normalize all master-data multi-select fields in a variant payload.
   * Returns resolved string arrays keyed by field name.
   */
  static async standardizeVariantMultiFields(
    variantData: Record<string, any>,
    context?: string,
  ): Promise<Record<string, string[]>> {
    const results: Record<string, string[]> = {};

    for (const [field, categoryKey] of Object.entries(MASTER_MULTI_FIELDS)) {
      if (variantData[field]) {
        results[field] = await this.standardizeMasterMultiField(field, categoryKey, variantData[field], context);
      }
    }

    return results;
  }

  /**
   * Get standardization report for recent imports.
   */
  static async getStandardizationReport(limit: number = 50): Promise<{
    total_checked: number;
    standardization_rate: number;
    by_field: Record<string, { total: number; standardized: number; rate: number }>;
  }> {
    const variants = await CarVariant.find({ is_deleted: false })
      .sort({ createdAt: -1 })
      .limit(limit);

    const report: Record<string, { total: number; standardized: number }> = {
      body_type: { total: 0, standardized: 0 },
      fuel_type: { total: 0, standardized: 0 },
      transmission_type: { total: 0, standardized: 0 },
    };

    // Batch fetch all referenced body types and fuel types instead of per-variant lookups
    const bodyTypeIds = new Set(variants.map((v: any) => v.body_type).filter(Boolean));
    const fuelTypeIds = new Set(variants.map((v: any) => v.fuel_type_id).filter(Boolean));

    const bodyTypes = await BodyType.find({
      body_type_id: { $in: Array.from(bodyTypeIds) },
      is_deleted: false,
    }).lean();
    const fuelTypes = await FuelType.find({
      fuel_type_id: { $in: Array.from(fuelTypeIds) },
      is_deleted: false,
    }).lean();

    const bodyTypeMap = new Map(bodyTypes.map((bt: any) => [bt.body_type_id, bt]));
    const fuelTypeMap = new Map(fuelTypes.map((ft: any) => [ft.fuel_type_id, ft]));

    for (const variant of variants) {
      if (variant.body_type) {
        report.body_type.total++;
        if (bodyTypeMap.has(variant.body_type)) report.body_type.standardized++;
      }

      if (variant.fuel_type_id) {
        report.fuel_type.total++;
        if (fuelTypeMap.has(variant.fuel_type_id)) report.fuel_type.standardized++;
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
      by_field: Object.fromEntries(
        Object.entries(report).map(([field, data]) => [
          field,
          {
            total: data.total,
            standardized: data.standardized,
            rate: data.total > 0 ? Math.round((data.standardized / data.total) * 100 * 10) / 10 : 0,
          },
        ])
      ),
    };
  }
}
