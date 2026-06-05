import { Document } from 'mongoose';
export interface IImportKeyMapping extends Document {
    mapping_id: string;
    source: 'carwale' | 'cardekho';
    scraped_key: string;
    normalized_scraped_key: string;
    target_model: 'Car' | 'CarVariant';
    target_field: string;
    target_section?: string;
    value_type?: 'string' | 'number' | 'boolean' | 'array';
    is_active: boolean;
    created_by?: string;
    updated_by?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ImportKeyMapping: import("mongoose").Model<IImportKeyMapping, {}, {}, {}, Document<unknown, {}, IImportKeyMapping, {}, import("mongoose").DefaultSchemaOptions> & IImportKeyMapping & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IImportKeyMapping>;
//# sourceMappingURL=import-key-mapping.model.d.ts.map