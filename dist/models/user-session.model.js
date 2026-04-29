"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSession = void 0;
const mongoose_1 = require("mongoose");
const userSessionSchema = new mongoose_1.Schema({
    session_id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    refresh_token: { type: String, required: true },
    expires_at: { type: Date, required: true },
    is_revoked: { type: Boolean, default: false },
    device_info: { type: String },
    ip_address: { type: String },
    revoked_at: { type: Date },
}, { timestamps: true });
userSessionSchema.index({ user_id: 1 });
userSessionSchema.index({ refresh_token: 1 });
userSessionSchema.index({ is_revoked: 1 });
userSessionSchema.index({ expires_at: 1 });
userSessionSchema.index({ user_id: 1, is_revoked: 1, expires_at: 1 });
userSessionSchema.index({ expires_at: 1, is_revoked: 1 });
userSessionSchema.index({ ip_address: 1 });
exports.UserSession = (0, mongoose_1.model)('UserSession', userSessionSchema);
//# sourceMappingURL=user-session.model.js.map