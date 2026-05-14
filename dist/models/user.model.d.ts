import { Document } from 'mongoose';
export declare enum UserRole {
    USER = "user",
    EDITOR = "editor",
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin"
}
export interface IUser extends Document {
    user_id: string;
    user_name: string;
    email: string;
    password?: string;
    phone?: string;
    whatsapp_phone?: string;
    whatsapp_opt_in?: boolean;
    profile_pic?: string;
    role: UserRole;
    is_email_verified: boolean;
    google_id?: string;
    is_deleted: boolean;
    theme?: string;
    is_active?: boolean;
    last_login_at?: Date;
    comparePassword(password: string): Promise<boolean>;
}
export declare const User: import("mongoose").Model<IUser, {}, {}, {}, Document<unknown, {}, IUser, {}, import("mongoose").DefaultSchemaOptions> & IUser & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUser>;
//# sourceMappingURL=user.model.d.ts.map