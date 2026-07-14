import { Document } from 'mongoose';
export interface ISettingsHistory extends Document {
    group: string;
    key?: string;
    old_value: any;
    new_value: any;
    updated_by: string;
    updated_by_name?: string;
    updated_at: Date;
    change_summary: string;
}
export declare const SettingsHistory: import("mongoose").Model<ISettingsHistory, {}, {}, {}, Document<unknown, {}, ISettingsHistory, {}, import("mongoose").DefaultSchemaOptions> & ISettingsHistory & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ISettingsHistory>;
