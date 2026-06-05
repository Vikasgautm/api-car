import { IVariantImportStaging, VariantImportStaging } from '../models/VariantImportStaging';
import { ImportSession } from '../models/ImportSession';
import { CarVariant } from '../../../models/car-variant.model';
import { FuelType } from '../../../models/fuel-type.model';
import { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ImportNormalizerService } from '../../imports/services/import-normalizer.service';
import { PowertrainDetectorService } from '../../variants/services/powertrain-detector.service';
import { CarAggregationService } from '../../../shared/services/car-aggregation.service';

export interface PushResult {
  staging_id: string;
  variant_id?: string;
  success: boolean;
  error?: string;
  action: 'created' | 'skipped' | 'failed';
}

export class VariantPushService {
  static async pushVariant(stagingId: string, pushedBy: string): Promise<PushResult> {
    const staging = await VariantImportStaging.findById(stagingId);
    if (!staging) return { staging_id: stagingId, success: false, error: 'Staging record not found', action: 'failed' };

    if (!staging.linked_car_id) {
      return { staging_id: stagingId, success: false, error: 'No linked car — link before pushing', action: 'failed' };
    }

    if (staging.import_status === 'pushed') {
      return { staging_id: stagingId, success: false, error: 'Already pushed', action: 'skipped' };
    }

    if (staging.import_status === 'rejected') {
      return { staging_id: stagingId, success: false, error: 'Variant is rejected', action: 'failed' };
    }

    try {
      // Resolve raw fuel type display name (e.g. 'Petrol') to the canonical UUID
      // (e.g. 'fuel_type_abc123') before saving. Storing raw names in fuel_type_id
      // corrupts the column and breaks all variant-by-fuel-type queries.
      let resolvedFuelTypeId: string | undefined;
      let fuelTypeSlug = 'petrol';
      if (staging.fuel_type) {
        const fuelTypeDoc = await FuelType.findOne({
          $or: [
            { name: { $regex: new RegExp(`^${staging.fuel_type}$`, 'i') } },
            { fuel_type_id: staging.fuel_type }, // already a UUID — pass through
          ],
          is_deleted: false,
        }).lean();
        if (fuelTypeDoc) {
          resolvedFuelTypeId = (fuelTypeDoc as any).fuel_type_id;
          fuelTypeSlug = (fuelTypeDoc as any).slug || 'petrol';
        }
        // If no match, skip setting fuel_type_id rather than storing the raw name.
      }

      // Produce the nested SpecsNormalized structure from raw specs.
      // staging.normalized_specs is a flat cleaned record (SpecNormalizationService output)
      // and belongs in specs_raw. ImportNormalizerService maps flat raw → nested SpecsNormalized.
      const normReport = ImportNormalizerService.normalize(staging.raw_specs || {});
      const powertrainFlags = PowertrainDetectorService.detect(normReport.specs_normalized, fuelTypeSlug);

      const slug = this.buildSlug(staging);
      const existing = await CarVariant.findOne({ slug });

      let variantId: string;

      if (existing) {
        // Non-destructive merge: fill gaps in specs_normalized per section, overwrite scalar fields
        const existingNormalized = (existing.specs_normalized as Record<string, any>) || {};
        const incomingNormalized = normReport.specs_normalized as Record<string, any>;
        const mergedNormalized: Record<string, any> = { ...existingNormalized };
        for (const [section, val] of Object.entries(incomingNormalized)) {
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            mergedNormalized[section] = { ...(existingNormalized[section] || {}), ...val };
          } else if (val !== null && val !== undefined) {
            mergedNormalized[section] = val;
          }
        }

        const update: Record<string, any> = { specs_normalized: mergedNormalized };
        if (staging.price) update.ex_showroom_price = staging.price;
        if (resolvedFuelTypeId) update.fuel_type_id = resolvedFuelTypeId;
        if (staging.transmission) update.transmission_type = staging.transmission.toLowerCase().replace(/ /g, '_');
        if (Object.keys(staging.raw_specs || {}).length > 0) {
          update.specs_raw = { ...(existing.specs_raw || {}), ...staging.raw_specs };
        }
        update.has_engine = powertrainFlags.has_engine;
        update.has_battery = powertrainFlags.has_battery;
        update.has_motor = powertrainFlags.has_motor;
        update.has_external_charging = powertrainFlags.has_external_charging;

        await CarVariant.updateOne({ _id: existing._id }, { $set: update });
        variantId = existing.variant_id;
      } else {
        const newVariantId = uuidv4();
        const variantData: Record<string, any> = {
          variant_id: newVariantId,
          car_id: staging.linked_car_id,
          variant_name: staging.variant_name,
          slug,
          model_year: this.extractModelYear(staging),
          is_published: false,
          is_deleted: false,
          is_archived: false,
          ex_showroom_price: staging.price,
          ...(resolvedFuelTypeId ? { fuel_type_id: resolvedFuelTypeId } : {}),
          transmission_type: staging.transmission ? staging.transmission.toLowerCase().replace(/ /g, '_') : undefined,
          specs_normalized: normReport.specs_normalized,
          specs_raw: staging.raw_specs || {},
          has_engine: powertrainFlags.has_engine,
          has_battery: powertrainFlags.has_battery,
          has_motor: powertrainFlags.has_motor,
          has_external_charging: powertrainFlags.has_external_charging,
        };

        const variant = new CarVariant(variantData);
        await variant.save();
        variantId = variant.variant_id;
      }

      await VariantImportStaging.updateOne(
        { _id: staging._id },
        {
          $set: {
            import_status: 'pushed',
            pushed_variant_id: variantId,
            pushed_by: pushedBy,
          },
        }
      );

      // Update session counters
      if (staging.import_session_id) {
        await ImportSession.updateOne(
          { _id: staging.import_session_id },
          { $inc: { pushed_variants: 1 } }
        );
      }

      // Recompute car aggregates so price range, fuel types, and variant count stay current
      try {
        await CarAggregationService.recomputeFullAggregates(staging.linked_car_id!);
      } catch {
        // Non-fatal — aggregates will reconcile on next manual recompute
      }

      return { staging_id: stagingId, variant_id: variantId, success: true, action: 'created' };
    } catch (err: any) {
      await VariantImportStaging.updateOne(
        { _id: staging._id },
        { $set: { import_status: 'push_failed', push_error: err.message } }
      );
      return { staging_id: stagingId, success: false, error: err.message, action: 'failed' };
    }
  }

  static async pushBulk(stagingIds: string[], pushedBy: string): Promise<PushResult[]> {
    const results: PushResult[] = [];
    for (const id of stagingIds) {
      results.push(await this.pushVariant(id, pushedBy));
    }
    return results;
  }

  static async getDiff(stagingId: string): Promise<{ field: string; existing: any; imported: any }[]> {
    const staging = await VariantImportStaging.findById(stagingId);
    if (!staging || !staging.linked_car_id) return [];

    const slug = this.buildSlug(staging);
    const existing = await CarVariant.findOne({ slug });
    if (!existing) return [];

    const diffs: { field: string; existing: any; imported: any }[] = [];
    const compareFields: Array<{ key: string; stagingKey: keyof IVariantImportStaging }> = [
      { key: 'ex_showroom_price', stagingKey: 'price' },
      { key: 'fuel_type_id', stagingKey: 'fuel_type' },
      { key: 'transmission_type', stagingKey: 'transmission' },
    ];

    for (const f of compareFields) {
      const existingVal = (existing as any)[f.key];
      const importedVal = staging[f.stagingKey];
      if (importedVal !== undefined && String(existingVal) !== String(importedVal)) {
        diffs.push({ field: f.key, existing: existingVal, imported: importedVal });
      }
    }

    const rawSpecs = staging.raw_specs || {};
    const existingRaw = (existing.specs_raw as Record<string, any>) || {};
    for (const [key, val] of Object.entries(rawSpecs)) {
      if (existingRaw[key] !== undefined && String(existingRaw[key]) !== String(val)) {
        diffs.push({ field: key, existing: existingRaw[key], imported: val });
      }
    }

    return diffs;
  }

  private static extractModelYear(staging: IVariantImportStaging): number {
    const specYear =
      staging.normalized_specs?.model_year ||
      staging.normalized_specs?.year ||
      staging.raw_specs?.model_year ||
      staging.raw_specs?.year;

    if (specYear) {
      const parsed = parseInt(String(specYear), 10);
      if (!isNaN(parsed) && parsed > 1900 && parsed < 2100) {
        return parsed;
      }
    }

    const yearRegex = /\b(19\d\d|20\d\d)\b/;
    const nameMatch =
      staging.variant_name?.match(yearRegex) ||
      staging.source_car_name?.match(yearRegex) ||
      (staging.normalized_car_name && staging.normalized_car_name.match(yearRegex));

    if (nameMatch) {
      return parseInt(nameMatch[1], 10);
    }

    return new Date().getFullYear();
  }

  private static buildSlug(staging: IVariantImportStaging): string {
    const carPart = (staging.linked_car_name || staging.source_car_name)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
    const variantPart = staging.variant_name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
    return `${carPart}-${variantPart}`;
  }
}
