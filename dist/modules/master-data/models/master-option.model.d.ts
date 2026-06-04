import { Document } from 'mongoose';
export interface IMasterOption extends Document {
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
export declare const MasterOption: import("mongoose").Model<IMasterOption, {}, {}, {}, Document<unknown, {}, IMasterOption, {}, import("mongoose").DefaultSchemaOptions> & IMasterOption & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IMasterOption>;
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
//# sourceMappingURL=master-option.model.d.ts.map