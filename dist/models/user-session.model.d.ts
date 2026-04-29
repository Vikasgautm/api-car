import { Document } from 'mongoose';
export interface IUserSession extends Document {
    session_id: string;
    user_id: string;
    refresh_token: string;
    expires_at: Date;
    is_revoked: boolean;
    device_info?: string;
    ip_address?: string;
    revoked_at?: Date;
}
export declare const UserSession: import("mongoose").Model<IUserSession, {}, {}, {}, Document<unknown, {}, IUserSession, {}, import("mongoose").DefaultSchemaOptions> & IUserSession & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUserSession>;
//# sourceMappingURL=user-session.model.d.ts.map