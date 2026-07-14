export declare class UserService {
    static getAllUsers(filterDto: any, includeDeleted?: boolean): Promise<{
        users: (import("../../../models/user.model").IUser & import("../../../sql/common/BaseModel").SQLDocument)[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getUserById(userId: string): Promise<(import("../../../models/user.model").IUser & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static createUser(userData: Record<string, unknown>): Promise<any>;
    static deleteUser(userId: string): Promise<import("../../../models/user.model").IUser & import("../../../sql/common/BaseModel").SQLDocument>;
    static restoreUser(userId: string): Promise<import("../../../models/user.model").IUser & import("../../../sql/common/BaseModel").SQLDocument>;
    static updateUser(userId: string, updateData: Record<string, unknown>): Promise<import("../../../models/user.model").IUser & import("../../../sql/common/BaseModel").SQLDocument>;
}
