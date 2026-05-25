import { Document } from 'mongoose';
export type SessionStatus = 'active' | 'completed' | 'partial' | 'failed';
export interface IImportSession extends Document {
    session_name: string;
    source_name: string;
    total_variants: number;
    linked_variants: number;
    validated_variants: number;
    pushed_variants: number;
    failed_variants: number;
    session_status: SessionStatus;
    imported_by: string;
    notes?: string;
    created_at: Date;
    updated_at: Date;
}
export declare const ImportSession: import("mongoose").Model<IImportSession, {}, {}, {}, Document<unknown, {}, IImportSession, {}, import("mongoose").DefaultSchemaOptions> & IImportSession & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IImportSession>;
//# sourceMappingURL=ImportSession.d.ts.map