import { Document } from 'mongoose';
export interface IUserSession extends Document {
    user_session_id: string;
    user_uuid: string;
    refresh_token: string;
    expiry_date: Date;
    is_active: boolean;
}
export declare const UserSession: import("mongoose").Model<IUserSession, {}, {}, {}, Document<unknown, {}, IUserSession, {}, import("mongoose").DefaultSchemaOptions> & IUserSession & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUserSession>;
//# sourceMappingURL=user-session.model.d.ts.map