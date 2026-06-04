import { IMasterOption, MasterCategory } from '../models/master-option.model';
export declare class MasterDataService {
    static getCategories(): Promise<MasterCategory[]>;
    static getOptions(categoryKey: string, includeInactive?: boolean): Promise<IMasterOption[]>;
    static getOptionByValue(categoryKey: string, value: string): Promise<IMasterOption | null>;
    static getAllActiveOptions(): Promise<Record<string, IMasterOption[]>>;
    static createOption(categoryKey: string, data: {
        label: string;
        value: string;
        sort_order?: number;
        metadata?: Record<string, any>;
    }): Promise<IMasterOption>;
    static updateOption(optionId: string, data: {
        label?: string;
        value?: string;
        sort_order?: number;
        is_active?: boolean;
        metadata?: Record<string, any>;
    }): Promise<IMasterOption>;
    static deleteOption(optionId: string): Promise<void>;
    static toggleActive(optionId: string): Promise<IMasterOption>;
    static reorderOptions(categoryKey: string, orderedIds: string[]): Promise<void>;
    static seedDefaults(): Promise<{
        created: number;
        skipped: number;
    }>;
    /**
     * Normalise a raw imported toggle/boolean value to true/false/null.
     * Handles: Yes, No, Available, Not Available, Standard, Included, Optional, NA, etc.
     */
    static normalizeBooleanImport(raw: any): boolean | null;
    /**
     * Normalise a raw imported multi-select value to string[].
     * Handles comma-separated strings and arrays.
     */
    static normalizeMultiSelectImport(raw: any): string[];
    /**
     * Find the closest matching option value for a category, or return 'other'.
     */
    static resolveDropdownImport(categoryKey: string, raw: any): Promise<string>;
    private static assertValidCategory;
}
//# sourceMappingURL=master-data.service.d.ts.map