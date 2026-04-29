"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoftDeleteUtil = void 0;
class SoftDeleteUtil {
    static async softDelete(model, id, deletedBy) {
        const updateData = {
            is_deleted: true,
            deleted_at: new Date(),
        };
        if (deletedBy) {
            updateData.deleted_by = deletedBy;
        }
        return await model.findByIdAndUpdate(id, updateData, { returnDocument: 'after', runValidators: true });
    }
    static async restore(model, id) {
        return await model.findByIdAndUpdate(id, {
            is_deleted: false,
            deleted_at: null,
            deleted_by: null,
        }, { returnDocument: 'after', runValidators: true });
    }
    static async permanentDelete(model, id) {
        return await model.findByIdAndDelete(id);
    }
    static async restoreMany(model, filter) {
        const result = await model.updateMany({ ...filter, is_deleted: true }, {
            is_deleted: false,
            deleted_at: null,
            deleted_by: null,
        });
        return { modifiedCount: result.modifiedCount || 0 };
    }
    static async softDeleteMany(model, filter, deletedBy) {
        const updateData = {
            is_deleted: true,
            deleted_at: new Date(),
        };
        if (deletedBy) {
            updateData.deleted_by = deletedBy;
        }
        const result = await model.updateMany({ ...filter, is_deleted: false }, updateData);
        return { modifiedCount: result.modifiedCount || 0 };
    }
    static isDeleted(document) {
        return document?.is_deleted === true;
    }
    static addDeletedFilter(filter, includeDeleted = false) {
        if (includeDeleted) {
            return filter;
        }
        return { ...filter, is_deleted: false };
    }
    static addOnlyDeletedFilter(filter) {
        return { ...filter, is_deleted: true };
    }
}
exports.SoftDeleteUtil = SoftDeleteUtil;
//# sourceMappingURL=soft-delete.util.js.map