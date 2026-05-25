"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditLockService = void 0;
const uuid_1 = require("uuid");
const edit_lock_model_1 = require("../../../models/edit-lock.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const LOCK_TTL_MINUTES = 30;
class EditLockService {
    static async acquireLock(entityType, entityId, userId, userName, userEmail) {
        const existing = await edit_lock_model_1.EditLock.findOne({ entity_type: entityType, entity_id: entityId });
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
            }
            else {
                throw new app_error_util_1.AppError(`This item is currently being edited by ${existing.locked_by_name}. Lock expires in ${Math.ceil((existing.expires_at.getTime() - Date.now()) / 60000)} minutes.`, 409);
            }
        }
        const lock = await edit_lock_model_1.EditLock.create({
            lock_id: (0, uuid_1.v4)(),
            entity_type: entityType,
            entity_id: entityId,
            locked_by: userId,
            locked_by_name: userName,
            locked_by_email: userEmail,
            expires_at: new Date(Date.now() + LOCK_TTL_MINUTES * 60 * 1000),
        });
        return lock;
    }
    static async releaseLock(entityType, entityId, userId) {
        const lock = await edit_lock_model_1.EditLock.findOne({ entity_type: entityType, entity_id: entityId });
        if (!lock)
            return;
        if (lock.locked_by !== userId) {
            throw new app_error_util_1.AppError('You cannot release a lock you do not own', 403);
        }
        await lock.deleteOne();
    }
    static async forceRelease(entityType, entityId) {
        await edit_lock_model_1.EditLock.deleteOne({ entity_type: entityType, entity_id: entityId });
    }
    static async checkLock(entityType, entityId) {
        const lock = await edit_lock_model_1.EditLock.findOne({ entity_type: entityType, entity_id: entityId });
        if (!lock)
            return { locked: false };
        if (lock.expires_at < new Date()) {
            await lock.deleteOne();
            return { locked: false };
        }
        return { locked: true, lock };
    }
    static async getUserActiveLocks(userId) {
        const now = new Date();
        return edit_lock_model_1.EditLock.find({ locked_by: userId, expires_at: { $gt: now } });
    }
    static async releaseExpiredLocks() {
        const result = await edit_lock_model_1.EditLock.deleteMany({ expires_at: { $lt: new Date() } });
        return result.deletedCount;
    }
}
exports.EditLockService = EditLockService;
//# sourceMappingURL=edit-lock.service.js.map