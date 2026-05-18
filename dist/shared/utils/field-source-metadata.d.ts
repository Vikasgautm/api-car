export declare enum SourcePriority {
    OEM_BROCHURE = 1,
    OEM_WEBSITE = 2,
    CAR_DEKHO = 3,
    CAR_WALE = 4,
    ZIG_WHEELS = 5,
    AI_EXTRACTION = 6
}
export interface FieldMetadata {
    value: any;
    source?: string;
    source_priority?: SourcePriority;
    confidence?: number;
    is_estimated?: boolean;
    last_updated?: Date;
    last_updated_by?: string;
}
export interface SpecsWithMetadata {
    values: Record<string, any>;
    metadata: Record<string, FieldMetadata>;
}
export declare class SourcePriorityMerge {
    static getSourcePriority(source: string): SourcePriority;
    static mergeFields(existing: FieldMetadata | undefined, incoming: FieldMetadata): {
        merged: FieldMetadata;
        changed: boolean;
    };
    static mergeVariantSpecs(existing: Record<string, any>, existingMetadata: Record<string, FieldMetadata>, incoming: Record<string, any>, incomingMetadata: Record<string, FieldMetadata>): {
        merged: Record<string, any>;
        mergedMetadata: Record<string, FieldMetadata>;
        changes: Array<{
            field: string;
            old_value: any;
            new_value: any;
            reason: string;
        }>;
    };
}
export declare class MetadataBuilder {
    static fromImportSource(value: any, source: string, confidence?: number, timestamp?: Date): FieldMetadata;
    static fromManualEdit(value: any, editedBy: string, timestamp?: Date): FieldMetadata;
    static fromEstimate(value: any, confidence?: number, timestamp?: Date): FieldMetadata;
}
//# sourceMappingURL=field-source-metadata.d.ts.map