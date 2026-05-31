import { IVariantImportStaging, VariantImportStaging } from '../models/VariantImportStaging';
import { ImportSession } from '../models/ImportSession';
import { CarVariant } from '../../../models/car-variant.model';
import { FuelType } from '../../../models/fuel-type.model';
import { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

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
      if (staging.fuel_type) {
        const fuelTypeDoc = await FuelType.findOne({
          $or: [
            { name: { $regex: new RegExp(`^${staging.fuel_type}$`, 'i') } },
            { fuel_type_id: staging.fuel_type }, // already a UUID — pass through
          ],
          is_deleted: false,
        }).lean();
        resolvedFuelTypeId = fuelTypeDoc?.fuel_type_id;
        // If no match, skip setting fuel_type_id rather than storing the raw name.
      }

      const slug = this.buildSlug(staging);
      const existing = await CarVariant.findOne({ slug });

      let variantId: string;

      if (existing) {
        // Update existing variant with imported specs (non-destructive merge)
        const update: Record<string, any> = {};
        if (staging.price) update.ex_showroom_price = staging.price;
        if (resolvedFuelTypeId) update.fuel_type_id = resolvedFuelTypeId;
        if (staging.transmission) update.transmission_type = staging.transmission.toLowerCase().replace(/ /g, '_');
        if (Object.keys(staging.normalized_specs || {}).length > 0) {
          update.specs_raw = { ...(existing.specs_raw || {}), ...staging.normalized_specs };
        }
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
          specs_raw: staging.normalized_specs || {},
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

      return { staging_id: stagingId, variant_id: variantId, success: true, action: 'created' };
    } catch (err: any) {
      await VariantImportStaging.updateOne(
        { _id: staging._id },
        { $set: { import_status: 'validation_failed' } }
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

    const rawSpecs = staging.normalized_specs || {};
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
