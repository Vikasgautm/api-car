export declare class UserService {
    static getAllUsers(filterDto: any, includeDeleted?: boolean): Promise<{
        users: (import("mongoose").Document<unknown, {}, import("../../../models/user.model").IUser, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/user.model").IUser & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getUserById(userId: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/user.model").IUser, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/user.model").IUser & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static createUser(userData: Record<string, unknown>): Promise<import("mongoose").Document<unknown, {}, import("../../../models/user.model").IUser, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/user.model").IUser & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static deleteUser(userId: string): Promise<import("mongoose").Document<unknown, {}, import("../../../models/user.model").IUser, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/user.model").IUser & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static restoreUser(userId: string): Promise<import("mongoose").Document<unknown, {}, import("../../../models/user.model").IUser, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/user.model").IUser & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static updateUser(userId: string, updateData: Record<string, unknown>): Promise<import("mongoose").Document<unknown, {}, import("../../../models/user.model").IUser, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/user.model").IUser & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
//# sourceMappingURL=user.service.d.ts.map