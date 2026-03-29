"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSession = void 0;
const mongoose_1 = require("mongoose");
const userSessionSchema = new mongoose_1.Schema({
    user_session_id: { type: String, required: true, unique: true },
    user_uuid: { type: String, ref: 'User', required: true },
    refresh_token: { type: String },
    expiry_date: { type: Date },
    is_active: { type: Boolean, default: true },
}, { timestamps: true });
exports.UserSession = (0, mongoose_1.model)('UserSession', userSessionSchema);
//# sourceMappingURL=user-session.model.js.map