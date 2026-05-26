"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifecycleRequest = void 0;
const mongoose_1 = require("mongoose");
const uuid_1 = require("uuid");
const lifecycleRequestSchema = new mongoose_1.Schema({
    request_id: { type: String, default: () => (0, uuid_1.v4)(), unique: true, index: true },
    car_id: { type: String, required: true, index: true },
    car_name: { type: String, required: true },
    car_slug: { type: String, required: true },
    model_family: { type: String, default: null },
    from_state: { type: String, required: true },
    to_state: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'otp_pending', 'approved', 'rejected', 'cancelled', 'expired'],
        default: 'pending',
        index: true,
    },
    reason: { type: String, default: null, maxlength: 1000 },
    requested_by_user_id: { type: String, required: true },
    requested_by_email: { type: String, default: null },
    requested_by_role: { type: String, default: null },
    otp_required: { type: Boolean, default: false },
    otp_hash: { type: String, select: false, default: null },
    otp_expires_at: { type: Date, default: null },
    otp_attempts: { type: Number, default: 0 },
    otp_max_attempts: { type: Number, default: 5 },
    otp_channel: { type: String, enum: ['email', 'console', null], default: null },
    otp_sent_to: { type: String, default: null },
    approved_by_user_id: { type: String, default: null },
    approved_at: { type: Date, default: null },
    rejected_by_user_id: { type: String, default: null },
    rejected_at: { type: Date, default: null },
    rejection_reason: { type: String, default: null, maxlength: 500 },
    cancelled_at: { type: Date, default: null },
    cancellation_reason: { type: String, default: null, maxlength: 500 },
    is_override: { type: Boolean, default: false },
    override_reason: { type: String, default: null, maxlength: 1000 },
    is_direct: { type: Boolean, default: false },
}, { timestamps: true });
// Prevent duplicate active requests for the same car + target state
lifecycleRequestSchema.index({ car_id: 1, status: 1 });
lifecycleRequestSchema.index({ requested_by_user_id: 1, createdAt: -1 });
lifecycleRequestSchema.index({ status: 1, createdAt: -1 });
lifecycleRequestSchema.index({ otp_expires_at: 1 });
exports.LifecycleRequest = (0, mongoose_1.model)('LifecycleRequest', lifecycleRequestSchema);
//# sourceMappingURL=lifecycle-request.model.js.map