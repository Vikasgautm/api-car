import { Document } from 'mongoose';
export type RedirectType = '301' | '302';
export interface IRedirect extends Document {
    redirect_id: string;
    old_url: string;
    new_url: string;
    type: RedirectType;
    reason?: string | null;
    created_by?: string | null;
    hit_count: number;
    last_hit_at?: Date | null;
    is_deleted: boolean;
}
export declare const Redirect: import("mongoose").Model<IRedirect, {}, {}, {}, Document<unknown, {}, IRedirect, {}, import("mongoose").DefaultSchemaOptions> & IRedirect & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IRedirect>;
//# sourceMappingURL=redirect.model.d.ts.map