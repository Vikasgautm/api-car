import { CarVariant } from '../../../models/car-variant.model';
import { ImportLog } from '../../../models/import-log.model';
import { SourcePriorityEngine, SourceType } from '../rules/source-priority-config';

export interface VariantSourceMetadata {
  variant_id: string;
  car_id: string;
  source_contribution: {
    source: SourceType;
    fields_contributed: string[];
    last_imported_at: Date;
    import_id: string;
  }[];
}

export class MultiSourceVariantService {
  /**
   * Consolidate specs from multiple import logs into a single high-quality variant.
   * Respects source priority for conflicts.
   */
  static async consolidateFromMultipleSources(
    variant_id: string
  ): Promise<{ merged_specs: any; metadata: VariantSourceMetadata }> {
    const variant = await CarVariant.findOne({ variant_id, is_deleted: false });
    if (!variant) {
      throw new Error(`Variant ${variant_id} not found`);
    }

    const importLogs = await ImportLog.find({
      variant_id,
      import_type: 'variant',
      is_deleted: false,
    }).sort({ created_at: -1 });

    const specsBySource = new Map<SourceType, Record<string, any>>();
    const fieldContributions = new Map<string, { source: SourceType; import_id: string; created_at: Date }[]>();

    for (const log of importLogs) {
      const source = (log.source as SourceType) || 'cardekho';

      if (log.matched_data?.specs_normalized) {
        specsBySource.set(source, log.matched_data.specs_normalized);
        this.trackFieldContributions(fieldContributions, log.matched_data.specs_normalized, source, log.import_id, log.createdAt);
      }
    }

    const mergedSpecs = SourcePriorityEngine.mergeSpecsFromMultipleSources(specsBySource);

    const sourceContribution = Array.from(specsBySource.keys()).map((source: SourceType) => {
      const contributions = Object.entries(fieldContributions)
        .filter(([_, sources]) => sources.some((s: any) => s.source === source))
        .map(([field]) => field);

      const latestLog = importLogs.find(log => (log.source as SourceType) === source);

      return {
        source,
        fields_contributed: contributions,
        last_imported_at: latestLog?.createdAt || new Date(),
        import_id: latestLog?.import_id || '',
      };
    });

    const metadata: VariantSourceMetadata = {
      variant_id,
      car_id: variant.car_id,
      source_contribution: sourceContribution,
    };

    return { merged_specs: mergedSpecs, metadata };
  }

  /**
   * Track which sources contributed which fields.
   */
  private static trackFieldContributions(
    map: Map<string, { source: SourceType; import_id: string; created_at: Date }[]>,
    specs: Record<string, any>,
    source: SourceType,
    import_id: string,
    createdAt: Date,
    prefix: string = ''
  ): void {
    for (const key in specs) {
      if (!specs.hasOwnProperty(key)) continue;

      const value = specs[key];
      const field = prefix ? `${prefix}.${key}` : key;

      if (value === null || value === undefined) continue;

      if (typeof value === 'object' && !Array.isArray(value)) {
        this.trackFieldContributions(map, value, source, import_id, createdAt, field);
      } else {
        if (!map.has(field)) {
          map.set(field, []);
        }
        map.get(field)!.push({ source, import_id, created_at: createdAt });
      }
    }
  }

  /**
   * Apply consolidated specs to a variant while preserving source metadata.
   */
  static async applyConsolidatedSpecs(
    variant_id: string,
    mergedSpecs: Record<string, any>
  ): Promise<void> {
    await CarVariant.updateOne(
      { variant_id },
      {
        specs_normalized: mergedSpecs,
        // Preserve existing specs_raw and best_for_tags
      }
    );
  }

  /**
   * Get which sources have imported a variant.
   */
  static async getSourceHistory(variant_id: string): Promise<SourceType[]> {
    const logs = await ImportLog.find({
      variant_id,
      import_type: 'variant',
      is_deleted: false,
    });

    return Array.from(new Set(logs.map(log => (log.source as SourceType) || 'cardekho')));
  }
}
