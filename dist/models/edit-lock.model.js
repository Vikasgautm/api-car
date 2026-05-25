"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditLock = void 0;
const mongoose_1 = require("mongoose");
const editLockSchema = new mongoose_1.Schema({
    lock_id: { type: String, required: true, unique: true },
    entity_type: { type: String, required: true },
    entity_id: { type: String, required: true },
    locked_by: { type: String, required: true },
    locked_by_name: { type: String, required: true },
    locked_by_email: { type: String, default: '' },
    expires_at: { type: Date, required: true },
}, { timestamps: true });
editLockSchema.index({ entity_type: 1, entity_id: 1 }, { unique: true });
editLockSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
editLockSchema.index({ locked_by: 1 });
exports.EditLock = (0, mongoose_1.model)('EditLock', editLockSchema);
//# sourceMappingURL=edit-lock.model.js.map