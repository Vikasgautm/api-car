import { SpecsNormalized, TransmissionType } from '../../../models/car-variant.model';
import { IImportKeyMapping } from '../../../models/import-key-mapping.model';
import { TargetFieldGroup } from '../constants/available-target-fields';
import { ExtractedCarData, ExtractedVariantData } from '../types/import.types';
export type ImportSource = 'carwale' | 'cardekho';
export interface UnmatchedCarField {
    scrapedKey: string;
    value: string;
    section: string;
    suggestedTargetField?: string;
    confidence: number;
}
export interface MatchedCarField {
    scrapedKey: string;
    value: any;
    targetField: string;
    targetLabel: string;
    confidence: number;
    matchType: string;
}
export interface UnmatchedSpecWithSuggestion {
    scrapedKey: string;
    value: string;
    section: string;
    suggestedTargetField?: string;
    suggestedCategory?: string;
    confidence: number;
}
export interface MatchedSpecPreview {
    scrapedKey: string;
    value: any;
    targetField: string;
    section: string;
    matchType: string;
    confidence: number;
}
export interface VariantSectionPreview {
    sourceUrl: string;
    extracted: ExtractedVariantData | null;
    variantName: string;
    fullName: string;
    price: number;
    priceText: string;
    fuelType: string;
    fuelTypeId?: string;
    fuelTypeMatched: boolean;
    transmission: string;
    transmissionNormalized?: string | null;
    matched: MatchedSpecPreview[];
    unmatched: UnmatchedSpecWithSuggestion[];
    specsNormalized: Partial<SpecsNormalized>;
    specsRaw: Record<string, any>;
    existing?: {
        variant_id: string;
        variant_name: string;
        slug: string;
    };
    warnings: string[];
}
export interface UnifiedPreviewResponse {
    success: boolean;
    source: ImportSource;
    car: {
        extracted: ExtractedCarData | null;
        matched: MatchedCarField[];
        unmatched: UnmatchedCarField[];
        raw: Record<string, any>;
        existing?: {
            car_id: string;
            name: string;
            slug: string;
        };
        warnings: string[];
    };
    variants: VariantSectionPreview[];
    availableTargetFields: TargetFieldGroup[];
    warnings: string[];
}
export interface ManualMapping {
    scrapedKey: string;
    targetField: string;
    value: any;
    saveMapping: boolean;
    section?: string;
}
export interface UnifiedSaveCarPayload {
    mode: 'create' | 'update' | 'merge';
    car_id?: string;
    name: string;
    brand_id: string;
    body_type_id: string;
    slug: string;
    description?: string;
    exshowroom_price?: number | null;
    expected_exshowroom_price?: number | null;
    is_electric: boolean;
    is_published: boolean;
    manualMappings: ManualMapping[];
    ignoredKeys: string[];
}
export interface UnifiedSaveVariantPayload {
    mode: 'create' | 'update' | 'merge';
    car_id: string;
    variant_id?: string;
    sourceUrl?: string;
    variantName: string;
    slug: string;
    modelYear: number;
    fuelTypeId?: string;
    transmissionType?: string | null;
    exShowroomPrice?: number;
    specsNormalized: any;
    specsRaw: any;
    manualMappings: ManualMapping[];
    ignoredKeys: string[];
}
export interface UnifiedSaveRequest {
    source: ImportSource;
    carUrl?: string;
    variantUrls?: string[];
    car?: UnifiedSaveCarPayload;
    variants?: UnifiedSaveVariantPayload[];
}
export interface UnifiedSaveResult {
    success: boolean;
    car_id?: string;
    variant_ids: string[];
    savedMappings: number;
    warnings: string[];
    errors: string[];
}
export declare class UnifiedImportService {
    static detectSource(url: string): ImportSource;
    private static fetchCarData;
    private static fetchVariantData;
    static normalizeKey(raw: string): string;
    private static loadSavedMappings;
    private static applyKeyMappings;
    private static buildCarMatchedFields;
    static validateMasterData(source: ImportSource, carUrl?: string, variantUrl?: string): Promise<string[]>;
    private static buildVariantSection;
    static unifiedPreview(source: ImportSource, carUrl: string | undefined, variantUrls: string[], userId: string): Promise<UnifiedPreviewResponse>;
    private static applyManualMappingsToSpecs;
    private static persistKeyMappings;
    static unifiedSave(payload: UnifiedSaveRequest, userId: string): Promise<UnifiedSaveResult>;
    static getKeyMappings(source?: ImportSource, targetModel?: 'Car' | 'CarVariant'): Promise<(IImportKeyMapping & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static deleteKeyMapping(mapping_id: string): Promise<(import("mongoose").Document<unknown, {}, IImportKeyMapping, {}, import("mongoose").DefaultSchemaOptions> & IImportKeyMapping & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    private static enhanceWithNormalization;
    static normalizeTransmission(transmission: string): TransmissionType | null;
}
//# sourceMappingURL=unified-import.service.d.ts.map