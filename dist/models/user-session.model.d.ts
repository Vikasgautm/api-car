import mongoose, { Document } from 'mongoose';
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
export declare const UserSession: mongoose.Model<any, {}, {}, {}, any, any, any>;
//# sourceMappingURL=user-session.model.d.ts.map