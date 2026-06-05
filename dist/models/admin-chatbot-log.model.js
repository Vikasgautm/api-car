"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminChatbotLog = void 0;
const mongoose_1 = require("mongoose");
const adminChatbotLogSchema = new mongoose_1.Schema({
    log_id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    role: { type: String, required: true },
    question: { type: String, required: true, maxlength: 500 },
    intent: { type: String, required: true },
    tool_used: { type: String, default: null },
    answer_length: { type: Number, default: 0 },
    data_rows_returned: { type: Number, default: 0 },
    response_time_ms: { type: Number, default: 0 },
    cerebras_used: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['success', 'fallback', 'error', 'permission_denied'],
        required: true,
    },
    error_message: { type: String, default: null },
    session_id: { type: String, default: null },
    current_page: { type: String, default: null },
}, { timestamps: true, collection: 'admin_chatbot_logs' });
adminChatbotLogSchema.index({ user_id: 1, createdAt: -1 });
adminChatbotLogSchema.index({ intent: 1 });
adminChatbotLogSchema.index({ status: 1 });
adminChatbotLogSchema.index({ createdAt: -1 });
exports.AdminChatbotLog = (0, mongoose_1.model)('AdminChatbotLog', adminChatbotLogSchema);
//# sourceMappingURL=admin-chatbot-log.model.js.map