export enum SourcePriority {
  OEM_BROCHURE = 1,
  OEM_WEBSITE = 2,
  CAR_DEKHO = 3,
  CAR_WALE = 4,
  ZIG_WHEELS = 5,
  AI_EXTRACTION = 6,
}

export interface FieldMetadata {
  value: any;
  source?: string;
  source_priority?: SourcePriority;
  confidence?: number; // 0-100
  is_estimated?: boolean;
  last_updated?: Date;
  last_updated_by?: string;
}

export interface SpecsWithMetadata {
  values: Record<string, any>;
  metadata: Record<string, FieldMetadata>;
}

export class SourcePriorityMerge {
  static getSourcePriority(source: string): SourcePriority {
    const lowerSource = source.toLowerCase();
    if (lowerSource.includes('oem') && lowerSource.includes('brochure')) return SourcePriority.OEM_BROCHURE;
    if (lowerSource.includes('oem') && lowerSource.includes('website')) return SourcePriority.OEM_WEBSITE;
    if (lowerSource.includes('cardekho') || lowerSource.includes('car dekho')) return SourcePriority.CAR_DEKHO;
    if (lowerSource.includes('carwale') || lowerSource.includes('car wale')) return SourcePriority.CAR_WALE;
    if (lowerSource.includes('zigwheels') || lowerSource.includes('zig wheels')) return SourcePriority.ZIG_WHEELS;
    if (lowerSource.includes('ai') || lowerSource.includes('llm')) return SourcePriority.AI_EXTRACTION;
    return SourcePriority.AI_EXTRACTION;
  }

  static mergeFields(
    existing: FieldMetadata | undefined,
    incoming: FieldMetadata,
  ): { merged: FieldMetadata; changed: boolean } {
    // No existing value, always accept incoming
    if (!existing) {
      return { merged: incoming, changed: true };
    }

    // Same source and value, no change
    if (
      existing.source === incoming.source &&
      JSON.stringify(existing.value) === JSON.stringify(incoming.value)
    ) {
      return { merged: existing, changed: false };
    }

    // Compare priorities
    const existingPriority = existing.source_priority || SourcePriority.AI_EXTRACTION;
    const incomingPriority = incoming.source_priority || SourcePriority.AI_EXTRACTION;

    // Higher priority source (lower number) overrides
    if (incomingPriority < existingPriority) {
      return { merged: incoming, changed: true };
    }

    // Same priority: prefer higher confidence
    if (incomingPriority === existingPriority) {
      const existingConf = existing.confidence || 0;
      const incomingConf = incoming.confidence || 0;
      if (incomingConf > existingConf) {
        return { merged: incoming, changed: true };
      }
    }

    // Keep existing if it has higher priority or equal priority with higher/equal confidence
    return { merged: existing, changed: false };
  }

  static mergeVariantSpecs(
    existing: Record<string, any>,
    existingMetadata: Record<string, FieldMetadata>,
    incoming: Record<string, any>,
    incomingMetadata: Record<string, FieldMetadata>,
  ): {
    merged: Record<string, any>;
    mergedMetadata: Record<string, FieldMetadata>;
    changes: Array<{ field: string; old_value: any; new_value: any; reason: string }>;
  } {
    const merged = { ...existing };
    const mergedMetadata = { ...existingMetadata };
    const changes: Array<{ field: string; old_value: any; new_value: any; reason: string }> = [];

    // Merge all incoming fields
    for (const [field, incomingValue] of Object.entries(incoming)) {
      const incomingMeta = incomingMetadata[field] || { value: incomingValue };
      const existingMeta = existingMetadata[field];
      const oldValue = existing[field];

      const { merged: resultMeta, changed } = this.mergeFields(existingMeta, incomingMeta);

      if (changed) {
        merged[field] = resultMeta.value;
        mergedMetadata[field] = resultMeta;
        changes.push({
          field,
          old_value: oldValue,
          new_value: resultMeta.value,
          reason: `Source: ${resultMeta.source} (priority ${resultMeta.source_priority}, confidence ${resultMeta.confidence})`,
        });
      }
    }

    return { merged, mergedMetadata, changes };
  }
}

export class MetadataBuilder {
  static fromImportSource(
    value: any,
    source: string,
    confidence: number = 85,
    timestamp: Date = new Date(),
  ): FieldMetadata {
    return {
      value,
      source,
      source_priority: SourcePriorityMerge.getSourcePriority(source),
      confidence,
      last_updated: timestamp,
    };
  }

  static fromManualEdit(value: any, editedBy: string, timestamp: Date = new Date()): FieldMetadata {
    return {
      value,
      source: 'Manual Edit',
      source_priority: SourcePriority.OEM_BROCHURE,
      confidence: 100,
      last_updated: timestamp,
      last_updated_by: editedBy,
    };
  }

  static fromEstimate(value: any, confidence: number = 50, timestamp: Date = new Date()): FieldMetadata {
    return {
      value,
      source: 'Estimated',
      source_priority: SourcePriority.AI_EXTRACTION,
      confidence,
      is_estimated: true,
      last_updated: timestamp,
    };
  }
}
