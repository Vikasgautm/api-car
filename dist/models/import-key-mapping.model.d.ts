export interface IImportKeyMapping {
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
import { BaseModel } from '../sql/common/BaseModel';
export declare const ImportKeyMapping: BaseModel<IImportKeyMapping>;
