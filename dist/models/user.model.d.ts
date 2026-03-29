import { Document } from 'mongoose';
export interface IUser extends Document {
    user_id: string;
    user_name: string;
    email: string;
    password?: string;
    phone?: string;
    profile_pic?: string;
    role: string;
    is_email_verified: boolean;
    google_id?: string;
    is_deleted: boolean;
    theme?: string;
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