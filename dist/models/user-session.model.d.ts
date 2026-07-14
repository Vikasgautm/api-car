export interface IUserSession {
    session_id: string;
    user_id: string;
    refresh_token: string;
    expires_at: Date;
    is_revoked: boolean;
    device_info?: string;
    ip_address?: string;
    revoked_at?: Date;
}
import { BaseModel } from '../sql/common/BaseModel';
export declare const UserSession: BaseModel<IUserSession>;
