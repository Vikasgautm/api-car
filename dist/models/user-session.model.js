"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSession = void 0;
const mongoose_1 = __importStar(require("mongoose"));
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
exports.UserSession = mongoose_1.default.models.UserSession || (0, mongoose_1.model)('UserSession', userSessionSchema);
//# sourceMappingURL=user-session.model.js.map