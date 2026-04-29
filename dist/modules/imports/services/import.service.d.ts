import { CarPreviewResponse, ImportResult, SaveCarImportRequest, SaveVariantImportRequest, VariantPreviewResponse } from '../types/import.types';
export declare class ImportService {
    static previewCarImport(url: string, userId: string): Promise<CarPreviewResponse>;
    static saveCarImport(payload: SaveCarImportRequest, userId: string): Promise<ImportResult>;
    static previewVariantImport(carId: string, urls: string[], userId: string): Promise<VariantPreviewResponse>;
    static saveVariantImport(payload: SaveVariantImportRequest, userId: string): Promise<ImportResult>;
    private static matchBrand;
    private static matchBodyType;
    private static matchFuelType;
    private static normalizeTransmission;
    static getImportLogs(userId: string, filter?: any): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/import-log.model").IImportLog, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/import-log.model").IImportLog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
}
//# sourceMappingURL=import.service.d.ts.map