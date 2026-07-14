"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const mongoose_1 = require("mongoose");
const auditLogSchema = new mongoose_1.Schema({
    audit_id: { type: String, required: true, unique: true },
    entity_type: { type: String, required: true },
    entity_id: { type: String, required: true },
    action: { type: String, required: true },
    field: { type: String, default: null },
    old_value: { type: mongoose_1.Schema.Types.Mixed, default: null },
    new_value: { type: mongoose_1.Schema.Types.Mixed, default: null },
    actor_user_id: { type: String, default: null },
    actor_email: { type: String, default: null },
    actor_role: { type: String, default: null },
    ip: { type: String, default: null },
    user_agent: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
}, { timestamps: false });
auditLogSchema.index({ entity_type: 1, entity_id: 1, timestamp: -1 });
auditLogSchema.index({ actor_user_id: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
// TTL: automatically delete audit logs older than 90 days
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });
exports.AuditLog = (0, mongoose_1.model)('AuditLog', auditLogSchema);
