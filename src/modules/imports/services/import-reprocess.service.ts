import { CarVariant, ICarVariant } from '../../../models/car-variant.model';
import { ImportLog } from '../../../models/import-log.model';
import { KeyMatcher } from '../extractors/key-matcher';
import { SEOTagGeneratorService } from './seo-tag-generator.service';
import { ExtractedSpec } from '../types/import.types';

export interface ReprocessResult {
  variant_id: string;
  variant_name: string;
  before: { normalized_keys: number; raw_keys: number; derived_keys: number };
  after: { normalized_keys: number; raw_keys: number; derived_keys: number };
  changed: boolean;
}

// ─── IMPORT REPROCESS ENGINE ──────────────────────────────────────────────────
// When SPEC_LABEL_MAP improves (e.g., new mapping added), re-run historical
// variants through the current normalization pipeline to pick up the new mappings.
// Reads original extracted specs from ImportLog, replays through Layers 2–6.

export class ImportReprocessService {
  // Re-process a single variant.
  static async reprocessVariant(variantId: string): Promise<ReprocessResult | null> {
    const variant = await CarVariant.findOne({
      variant_id: variantId,
      is_deleted: false,
    });

    if (!variant) {
      return null;
    }

    // Fetch the import log entry that has the original extracted specs.
    const importLog = await ImportLog.findOne({
      variant_id: variantId,
      import_type: 'variant',
      is_deleted: false,
    }).sort({ created_at: -1 }); // Most recent if multiple

    if (!importLog || !importLog.extracted_data?.specs) {
      return null; // No raw data to reprocess from.
    }

    return this.reprocessVariantWithData(variant, importLog);
  }

  // Internal method that accepts pre-fetched variant and import log (no refetch)
  private static async reprocessVariantWithData(
    variant: any,
    importLog: any | undefined
  ): Promise<ReprocessResult | null> {
    if (!importLog || !importLog.extracted_data?.specs) {
      return null;
    }

    const extractedSpecs = importLog.extracted_data.specs as ExtractedSpec[];

    // Re-run through the current pipeline.
    const { matched, unmatched } = await KeyMatcher.matchSpecs(extractedSpecs);
    const { specs_normalized, specs_raw } = KeyMatcher.mapMatchedSpecsToSpecsNormalized(
      matched
    );

    // Detect if anything changed.
    const beforeNormalized = Object.keys(variant.specs_normalized || {}).length;
    const beforeRaw = Object.keys(variant.specs_raw || {}).length;
    const beforeDerived = Object.keys(variant.specs_raw?.derived || {}).length;

    const afterNormalized = Object.keys(specs_normalized || {}).length;
    const afterRaw = Object.keys(specs_raw || {}).length;
    const afterDerived = Object.keys(specs_raw?.derived || {}).length;

    const changed =
      JSON.stringify(variant.specs_normalized) !== JSON.stringify(specs_normalized) ||
      JSON.stringify(variant.specs_raw) !== JSON.stringify(specs_raw);

    // Regenerate SEO tags from reprocessed specs_raw.
    const generatedTags = SEOTagGeneratorService.generateTagsFromDerivedFlags(specs_raw);
    const bestForTags = SEOTagGeneratorService.mergeTags(
      variant.best_for_tags,
      generatedTags
    );

    // Update the variant with reprocessed specs and regenerated tags.
    await CarVariant.updateOne(
      { variant_id: variant.variant_id },
      {
        specs_normalized: specs_normalized || {},
        specs_raw: specs_raw || {},
        best_for_tags: bestForTags,
      }
    );

    return {
      variant_id: variant.variant_id,
      variant_name: variant.variant_name,
      before: {
        normalized_keys: beforeNormalized,
        raw_keys: beforeRaw,
        derived_keys: beforeDerived,
      },
      after: {
        normalized_keys: afterNormalized,
        raw_keys: afterRaw,
        derived_keys: afterDerived,
      },
      changed,
    };
  }

  // Re-process all variants of a single car.
  static async reprocessCar(carId: string): Promise<ReprocessResult[]> {
    const variants = await CarVariant.find({
      car_id: carId,
      is_deleted: false,
    });

    // Batch fetch import logs for all variants to avoid N findOne queries
    const importLogs = await ImportLog.find({
      variant_id: { $in: variants.map(v => v.variant_id) },
      import_type: 'variant',
      is_deleted: false,
    }).lean();

    const logsMap = new Map(importLogs.map((log: any) => [log.variant_id, log]));

    // Parallelize reprocessing instead of sequential
    const reprocessPromises = variants.map(variant =>
      this.reprocessVariantWithData(variant, logsMap.get(variant.variant_id))
        .catch(err => {
          console.error(`Failed to reprocess variant ${variant.variant_id}:`, err);
          return null;
        })
    );

    const results = (await Promise.all(reprocessPromises)).filter(
      (r): r is ReprocessResult => r !== null
    );

    return results;
  }

  // Re-process ALL variants in the system (use when SPEC_LABEL_MAP gets a major upgrade).
  static async reprocessAll(): Promise<{
    total: number;
    succeeded: number;
    failed: number;
    results: ReprocessResult[];
  }> {
    const variants = await CarVariant.find({
      is_deleted: false,
    });

    // Batch fetch import logs for all variants to avoid N findOne queries
    const importLogs = await ImportLog.find({
      variant_id: { $in: variants.map(v => v.variant_id) },
      import_type: 'variant',
      is_deleted: false,
    }).lean();

    const logsMap = new Map(importLogs.map((log: any) => [log.variant_id, log]));

    // Parallelize reprocessing instead of sequential
    const reprocessPromises = variants.map(variant =>
      this.reprocessVariantWithData(variant, logsMap.get(variant.variant_id))
        .catch(err => {
          console.error(`Failed to reprocess variant ${variant.variant_id}:`, err);
          return null;
        })
    );

    const results = (await Promise.all(reprocessPromises)).filter(
      (r): r is ReprocessResult => r !== null
    );

    return {
      total: variants.length,
      succeeded: results.length,
      failed: variants.length - results.length,
      results: results.filter(r => r.changed), // Return only changed ones
    };
  }
}
