import { IUser } from '../../../models/user.model';
export declare class AuthService {
    static generateToken(user: IUser): string;
    static signup(userData: any): Promise<{
        user: import("mongoose").Document<unknown, {}, IUser, {}, import("mongoose").DefaultSchemaOptions> & IUser & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        token: string;
    }>;
    static login(loginData: any): Promise<{
        user: import("mongoose").Document<unknown, {}, IUser, {}, import("mongoose").DefaultSchemaOptions> & IUser & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        token: string;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map