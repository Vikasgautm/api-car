export type SpecValueType = 'string' | 'number' | 'boolean' | 'transmission' | 'array';
export interface SpecMapping {
    category: string;
    key: string;
    path?: string;
    rootKey?: string;
    type: SpecValueType;
}
export declare const SPEC_LABEL_MAP: Record<string, SpecMapping>;
export declare const INVALID_LABELS: string[];
export declare function normalizeLabel(label: string): string;
export declare function isInvalidLabel(label: string): boolean;
export declare function getSpecMapping(label: string): SpecMapping | null;
export declare function parseSpecValue(value: string, type: SpecMapping['type']): any;
export declare function guessCategory(label: string, section: string): string;
//# sourceMappingURL=spec-key-map.d.ts.map