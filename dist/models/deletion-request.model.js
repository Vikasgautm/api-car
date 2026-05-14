"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeletionRequest = void 0;
const mongoose_1 = require("mongoose");
const deletionRequestSchema = new mongoose_1.Schema({
    request_id: { type: String, required: true, unique: true },
    entity_type: { type: String, required: true, enum: ['car'] },
    entity_id: { type: String, required: true },
    action: { type: String, required: true, enum: ['archive', 'disable', 'discontinue', 'hard_delete'] },
    reason: { type: String, default: null, maxlength: 500 },
    redirect_to_slug: { type: String, default: null },
    requested_by_user_id: { type: String, required: true },
    requested_by_email: { type: String, default: null },
    requested_by_role: { type: String, default: null },
    otp_hash: { type: String, required: true, select: false },
    otp_expires_at: { type: Date, required: true },
    otp_attempts: { type: Number, default: 0 },
    otp_max_attempts: { type: Number, default: 5 },
    otp_channel: { type: String, required: true, enum: ['whatsapp', 'console'] },
    otp_sent_to: { type: String, default: null },
    status: { type: String, required: true, enum: ['pending', 'approved', 'rejected', 'expired', 'cancelled'], default: 'pending' },
    approved_by_user_id: { type: String, default: null },
    approved_at: { type: Date, default: null },
    cancelled_at: { type: Date, default: null },
    cancellation_reason: { type: String, default: null },
}, { timestamps: true });
deletionRequestSchema.index({ entity_type: 1, entity_id: 1, status: 1 });
deletionRequestSchema.index({ requested_by_user_id: 1, createdAt: -1 });
deletionRequestSchema.index({ status: 1, createdAt: -1 });
deletionRequestSchema.index({ otp_expires_at: 1 });
exports.DeletionRequest = (0, mongoose_1.model)('DeletionRequest', deletionRequestSchema);
//# sourceMappingURL=deletion-request.model.js.map