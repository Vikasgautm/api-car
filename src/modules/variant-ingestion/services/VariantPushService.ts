import { IVariantImportStaging, VariantImportStaging } from '../models/VariantImportStaging';
import { ImportSession } from '../models/ImportSession';
import { CarVariant } from '../../../models/car-variant.model';
import { Types } from 'mongoose';

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
      const slug = this.buildSlug(staging);
      const existing = await CarVariant.findOne({ slug });

      let variantId: string;

      if (existing) {
        // Update existing variant with imported specs (non-destructive merge)
        const update: Record<string, any> = {};
        if (staging.price) update.ex_showroom_price = staging.price;
        if (staging.fuel_type) update.fuel_type_id = staging.fuel_type;
        if (staging.transmission) update.transmission_type = staging.transmission.toLowerCase().replace(/ /g, '_');
        if (Object.keys(staging.normalized_specs || {}).length > 0) {
          update.specs_raw = { ...(existing.specs_raw || {}), ...staging.normalized_specs };
        }
        await CarVariant.updateOne({ _id: existing._id }, { $set: update });
        variantId = String(existing._id);
      } else {
        const variantData: Record<string, any> = {
          car_id: staging.linked_car_id,
          variant_name: staging.variant_name,
          slug,
          is_published: false,
          is_deleted: false,
          ex_showroom_price: staging.price,
          fuel_type_id: staging.fuel_type,
          transmission_type: staging.transmission ? staging.transmission.toLowerCase().replace(/ /g, '_') : undefined,
          specs_raw: staging.normalized_specs || {},
        };

        const variant = new CarVariant(variantData);
        await variant.save();
        variantId = String(variant._id);
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
