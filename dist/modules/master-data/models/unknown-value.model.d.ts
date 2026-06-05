import { Document } from 'mongoose';
export interface IUnknownValue extends Document {
    unknown_id: string;
    category_key: string;
    raw_value: string;
    context?: string;
    occurrence_count: number;
    is_resolved: boolean;
    resolved_to?: string;
    resolved_at?: Date;
    created_at: Date;
    updated_at: Date;
}
export declare const UnknownValue: import("mongoose").Model<IUnknownValue, {}, {}, {}, Document<unknown, {}, IUnknownValue, {}, import("mongoose").DefaultSchemaOptions> & IUnknownValue & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUnknownValue>;
//# sourceMappingURL=unknown-value.model.d.ts.map