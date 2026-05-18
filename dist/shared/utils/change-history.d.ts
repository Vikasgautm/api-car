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
export declare class ChangeHistoryTracker {
    static createEntry(field: string, oldValue: any, newValue: any, changedBy: string, changeSource?: ChangeHistoryEntry['change_source'], notes?: string): ChangeHistoryEntry;
    static createSpecEntry(field: string, oldValue: any, newValue: any, changedBy: string, section: string, changeSource?: ChangeHistoryEntry['change_source'], options?: {
        dataType?: string;
        confidence?: number;
        sourceSystem?: string;
        notes?: string;
    }): SpecChangeHistoryEntry;
    static detectChanges(oldDoc: Record<string, any>, newDoc: Record<string, any>, fieldsToTrack?: string[]): Array<{
        field: string;
        oldValue: any;
        newValue: any;
    }>;
    static detectSpecChanges(oldSpecs: Record<string, any>, newSpecs: Record<string, any>): Array<{
        field: string;
        section: string;
        oldValue: any;
        newValue: any;
    }>;
    static summarizeChanges(changes: ChangeHistoryEntry[]): {
        totalChanges: number;
        changedFields: Set<string>;
        changedBy: Set<string>;
        changeSources: Set<string>;
        latestChange: ChangeHistoryEntry | null;
    };
    static filterChangesByDateRange(changes: ChangeHistoryEntry[], startDate: Date, endDate: Date): ChangeHistoryEntry[];
    static filterChangesByField(changes: ChangeHistoryEntry[], field: string): ChangeHistoryEntry[];
    static filterChangesBySource(changes: ChangeHistoryEntry[], source: ChangeHistoryEntry['change_source']): ChangeHistoryEntry[];
    static auditTrail(changes: ChangeHistoryEntry[]): string;
}
//# sourceMappingURL=change-history.d.ts.map