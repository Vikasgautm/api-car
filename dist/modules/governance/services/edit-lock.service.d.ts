import { IEditLock } from '../../../models/edit-lock.model';
export interface LockInfo {
    locked: boolean;
    lock?: IEditLock;
}
export declare class EditLockService {
    static acquireLock(entityType: string, entityId: string, userId: string, userName: string, userEmail: string): Promise<IEditLock>;
    static releaseLock(entityType: string, entityId: string, userId: string): Promise<void>;
    static forceRelease(entityType: string, entityId: string): Promise<void>;
    static checkLock(entityType: string, entityId: string): Promise<LockInfo>;
    static getUserActiveLocks(userId: string): Promise<(import("mongoose").Document<unknown, {}, IEditLock, {}, import("mongoose").DefaultSchemaOptions> & IEditLock & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    static releaseExpiredLocks(): Promise<number>;
}
//# sourceMappingURL=edit-lock.service.d.ts.map