import { Document } from 'mongoose';
export type ImportType = 'car' | 'variant';
export type ImportStatus = 'previewed' | 'saved' | 'failed';
export type ImportSource = 'cardekho';
export interface IImportLog extends Omit<Document, 'errors'> {
    import_id: string;
    source: ImportSource;
    import_type: ImportType;
    source_url: string;
    car_id?: string;
    variant_id?: string;
    status: ImportStatus;
    extracted_data: Record<string, any>;
    matched_data: Record<string, any>;
    unmatched_data: Record<string, any>;
    warnings: string[];
    error_messages: string[];
    created_by: string;
    created_at: Date;
    updated_at: Date;
}
export declare const ImportLog: import("mongoose").Model<IImportLog, {}, {}, {}, Document<unknown, {}, IImportLog, {}, import("mongoose").DefaultSchemaOptions> & IImportLog & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IImportLog>;
//# sourceMappingURL=import-log.model.d.ts.map