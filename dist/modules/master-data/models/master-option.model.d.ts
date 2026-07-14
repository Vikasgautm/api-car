export interface IMasterOption {
    option_id: string;
    category_key: string;
    label: string;
    value: string;
    sort_order: number;
    is_active: boolean;
    is_system: boolean;
    metadata?: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}
export interface MasterCategory {
    key: string;
    label: string;
    description: string;
    multi_select: boolean;
}
export declare const MASTER_CATEGORIES: MasterCategory[];
export declare const MASTER_SEED_DATA: Record<string, {
    label: string;
    value: string;
}[]>;
import { BaseModel } from '../../../sql/common/BaseModel';
export declare const MasterOption: BaseModel<IMasterOption>;
