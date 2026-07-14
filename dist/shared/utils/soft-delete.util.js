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
        const pk = model.primaryKey || 'id';
        await model.updateDirect({ [pk]: id }, updateData);
        return await model.findOne({ [pk]: id });
    }
    static async restore(model, id) {
        const pk = model.primaryKey || 'id';
        await model.updateDirect({ [pk]: id }, {
            is_deleted: false,
            deleted_at: null,
            deleted_by: null,
        });
        return await model.findOne({ [pk]: id });
    }
    static async permanentDelete(model, id) {
        const pk = model.primaryKey || 'id';
        const document = await model.findOne({ [pk]: id });
        if (!document)
            return null;
        await model.deleteDirect({ [pk]: id });
        return document;
    }
    static async restoreMany(model, filter) {
        const pk = model.primaryKey || 'id';
        const count = await model.updateDirect({ ...filter, is_deleted: true }, {
            is_deleted: false,
            deleted_at: null,
            deleted_by: null,
        });
        return { modifiedCount: count };
    }
    static async softDeleteMany(model, filter, deletedBy) {
        const updateData = {
            is_deleted: true,
            deleted_at: new Date(),
        };
        if (deletedBy) {
            updateData.deleted_by = deletedBy;
        }
        const pk = model.primaryKey || 'id';
        const count = await model.updateDirect({ ...filter, is_deleted: false }, updateData);
        return { modifiedCount: count };
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
