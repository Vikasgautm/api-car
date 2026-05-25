import { Document } from 'mongoose';
export interface IEditLock extends Document {
    lock_id: string;
    entity_type: string;
    entity_id: string;
    locked_by: string;
    locked_by_name: string;
    locked_by_email: string;
    expires_at: Date;
}
export declare const EditLock: import("mongoose").Model<IEditLock, {}, {}, {}, Document<unknown, {}, IEditLock, {}, import("mongoose").DefaultSchemaOptions> & IEditLock & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IEditLock>;
//# sourceMappingURL=edit-lock.model.d.ts.map