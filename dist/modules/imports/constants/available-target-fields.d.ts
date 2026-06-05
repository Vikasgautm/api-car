export interface TargetField {
    key: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    model: 'Car' | 'CarVariant';
}
export interface TargetFieldGroup {
    section: string;
    fields: TargetField[];
}
export declare const AVAILABLE_TARGET_FIELD_GROUPS: TargetFieldGroup[];
export declare const ALL_TARGET_FIELDS: TargetField[];
export declare const TARGET_FIELD_MAP: Record<string, TargetField>;
//# sourceMappingURL=available-target-fields.d.ts.map