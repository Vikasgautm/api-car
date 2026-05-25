import { v4 as uuidv4 } from 'uuid';
import { EditLock, IEditLock } from '../../../models/edit-lock.model';
import { AppError } from '../../../shared/utils/app-error.util';

const LOCK_TTL_MINUTES = 30;

export interface LockInfo {
  locked: boolean;
  lock?: IEditLock;
}

export class EditLockService {
  static async acquireLock(
    entityType: string,
    entityId: string,
    userId: string,
    userName: string,
    userEmail: string
  ): Promise<IEditLock> {
    const existing = await EditLock.findOne({ entity_type: entityType, entity_id: entityId });

    if (existing) {
      // If the lock belongs to the same user, refresh it
      if (existing.locked_by === userId) {
        existing.expires_at = new Date(Date.now() + LOCK_TTL_MINUTES * 60 * 1000);
        await existing.save();
        return existing;
      }
      // Check if lock is expired
      if (existing.expires_at < new Date()) {
        await existing.deleteOne();
      } else {
        throw new AppError(
          `This item is currently being edited by ${existing.locked_by_name}. Lock expires in ${Math.ceil((existing.expires_at.getTime() - Date.now()) / 60000)} minutes.`,
          409
        );
      }
    }

    const lock = await EditLock.create({
      lock_id: uuidv4(),
      entity_type: entityType,
      entity_id: entityId,
      locked_by: userId,
      locked_by_name: userName,
      locked_by_email: userEmail,
      expires_at: new Date(Date.now() + LOCK_TTL_MINUTES * 60 * 1000),
    });

    return lock;
  }

  static async releaseLock(entityType: string, entityId: string, userId: string): Promise<void> {
    const lock = await EditLock.findOne({ entity_type: entityType, entity_id: entityId });
    if (!lock) return;
    if (lock.locked_by !== userId) {
      throw new AppError('You cannot release a lock you do not own', 403);
    }
    await lock.deleteOne();
  }

  static async forceRelease(entityType: string, entityId: string): Promise<void> {
    await EditLock.deleteOne({ entity_type: entityType, entity_id: entityId });
  }

  static async checkLock(entityType: string, entityId: string): Promise<LockInfo> {
    const lock = await EditLock.findOne({ entity_type: entityType, entity_id: entityId });
    if (!lock) return { locked: false };
    if (lock.expires_at < new Date()) {
      await lock.deleteOne();
      return { locked: false };
    }
    return { locked: true, lock };
  }

  static async getUserActiveLocks(userId: string) {
    const now = new Date();
    return EditLock.find({ locked_by: userId, expires_at: { $gt: now } });
  }

  static async releaseExpiredLocks(): Promise<number> {
    const result = await EditLock.deleteMany({ expires_at: { $lt: new Date() } });
    return result.deletedCount;
  }
}
