import { IMasterOption, MasterCategory } from '../models/master-option.model';
import { IUnknownValue } from '../models/unknown-value.model';
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
    static normalizeBooleanImport(raw: any): boolean | null;
    static normalizeMultiSelectImport(raw: any): string[];
    static resolveDropdownImport(categoryKey: string, raw: any): Promise<string>;
    static logUnknownValue(categoryKey: string, rawValue: string, context?: string): Promise<void>;
    static getUnknownValues(resolvedFilter?: boolean): Promise<IUnknownValue[]>;
    static resolveUnknownValue(unknownId: string, targetOptionValue: string): Promise<IUnknownValue>;
    static dismissUnknownValue(unknownId: string): Promise<void>;
    static promoteUnknownToMaster(unknownId: string): Promise<IMasterOption>;
    static getPublicLabelMap(): Promise<Record<string, Record<string, string>>>;
    private static assertValidCategory;
}
