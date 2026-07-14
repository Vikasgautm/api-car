import { IVariantImportStaging } from '../models/VariantImportStaging';
export interface GroupedVariants {
    normalized_name: string;
    source_names: string[];
    variants: IVariantImportStaging[];
    suggested_car_id?: string;
    suggested_car_name?: string;
}
export declare class VariantGroupingService {
    static normalizeName(name: string): string;
    static slugify(name: string): string;
    static similarity(a: string, b: string): number;
    static groupVariants(variants: IVariantImportStaging[]): GroupedVariants[];
    static applyGrouping(sessionId: string): Promise<{
        grouped: number;
        groups: number;
    }>;
}
