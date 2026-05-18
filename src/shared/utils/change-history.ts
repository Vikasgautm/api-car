export interface ChangeHistoryEntry {
  field: string;
  old_value: any;
  new_value: any;
  changed_by: string;
  changed_at: Date;
  change_source: 'manual_edit' | 'import' | 'bulk_operation' | 'system' | 'api';
  notes?: string;
}

export interface SpecChangeHistoryEntry extends ChangeHistoryEntry {
  section?: string;
  data_type?: string;
  confidence?: number;
  source_system?: string;
}

export class ChangeHistoryTracker {
  static createEntry(
    field: string,
    oldValue: any,
    newValue: any,
    changedBy: string,
    changeSource: ChangeHistoryEntry['change_source'] = 'manual_edit',
    notes?: string,
  ): ChangeHistoryEntry {
    return {
      field,
      old_value: oldValue,
      new_value: newValue,
      changed_by: changedBy,
      changed_at: new Date(),
      change_source: changeSource,
      notes,
    };
  }

  static createSpecEntry(
    field: string,
    oldValue: any,
    newValue: any,
    changedBy: string,
    section: string,
    changeSource: ChangeHistoryEntry['change_source'] = 'manual_edit',
    options?: {
      dataType?: string;
      confidence?: number;
      sourceSystem?: string;
      notes?: string;
    },
  ): SpecChangeHistoryEntry {
    return {
      field,
      old_value: oldValue,
      new_value: newValue,
      changed_by: changedBy,
      changed_at: new Date(),
      change_source: changeSource,
      section,
      data_type: options?.dataType,
      confidence: options?.confidence,
      source_system: options?.sourceSystem,
      notes: options?.notes,
    };
  }

  static detectChanges(
    oldDoc: Record<string, any>,
    newDoc: Record<string, any>,
    fieldsToTrack?: string[],
  ): Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }> {
    const changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
    }> = [];

    const fields = fieldsToTrack || Object.keys(newDoc);

    for (const field of fields) {
      const oldValue = oldDoc[field];
      const newValue = newDoc[field];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field,
          oldValue,
          newValue,
        });
      }
    }

    return changes;
  }

  static detectSpecChanges(
    oldSpecs: Record<string, any>,
    newSpecs: Record<string, any>,
  ): Array<{
    field: string;
    section: string;
    oldValue: any;
    newValue: any;
  }> {
    const changes: Array<{
      field: string;
      section: string;
      oldValue: any;
      newValue: any;
    }> = [];

    const sections = new Set([
      ...Object.keys(oldSpecs || {}),
      ...Object.keys(newSpecs || {}),
    ]);

    for (const section of sections) {
      const oldSection = oldSpecs?.[section] || {};
      const newSection = newSpecs?.[section] || {};

      const fields = new Set([...Object.keys(oldSection), ...Object.keys(newSection)]);

      for (const field of fields) {
        const oldValue = oldSection[field];
        const newValue = newSection[field];

        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({
            field,
            section,
            oldValue,
            newValue,
          });
        }
      }
    }

    return changes;
  }

  static summarizeChanges(changes: ChangeHistoryEntry[]): {
    totalChanges: number;
    changedFields: Set<string>;
    changedBy: Set<string>;
    changeSources: Set<string>;
    latestChange: ChangeHistoryEntry | null;
  } {
    return {
      totalChanges: changes.length,
      changedFields: new Set(changes.map((c) => c.field)),
      changedBy: new Set(changes.map((c) => c.changed_by)),
      changeSources: new Set(changes.map((c) => c.change_source)),
      latestChange: changes.length > 0 ? changes[changes.length - 1] : null,
    };
  }

  static filterChangesByDateRange(
    changes: ChangeHistoryEntry[],
    startDate: Date,
    endDate: Date,
  ): ChangeHistoryEntry[] {
    return changes.filter((c) => c.changed_at >= startDate && c.changed_at <= endDate);
  }

  static filterChangesByField(changes: ChangeHistoryEntry[], field: string): ChangeHistoryEntry[] {
    return changes.filter((c) => c.field === field);
  }

  static filterChangesBySource(
    changes: ChangeHistoryEntry[],
    source: ChangeHistoryEntry['change_source'],
  ): ChangeHistoryEntry[] {
    return changes.filter((c) => c.change_source === source);
  }

  static auditTrail(changes: ChangeHistoryEntry[]): string {
    if (changes.length === 0) return 'No changes recorded.';

    return changes
      .map(
        (c) =>
          `[${c.changed_at.toISOString()}] ${c.field}: ${JSON.stringify(c.old_value)} → ${JSON.stringify(c.new_value)} (by ${c.changed_by}, source: ${c.change_source})`,
      )
      .join('\n');
  }
}
