import { Document, model, Schema } from 'mongoose';

export type ChatbotLogStatus = 'success' | 'fallback' | 'error' | 'permission_denied';

export interface IAdminChatbotLog extends Document {
  log_id: string;
  user_id: string;
  role: string;
  question: string;
  intent: string;
  tool_used: string | null;
  answer_length: number;
  data_rows_returned: number;
  response_time_ms: number;
  cerebras_used: boolean;
  status: ChatbotLogStatus;
  error_message: string | null;
  session_id: string | null;
  current_page: string | null;
  createdAt: Date;
}

const adminChatbotLogSchema = new Schema<IAdminChatbotLog>(
  {
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
  },
  { timestamps: true, collection: 'admin_chatbot_logs' }
);

adminChatbotLogSchema.index({ user_id: 1, createdAt: -1 });
adminChatbotLogSchema.index({ intent: 1 });
adminChatbotLogSchema.index({ status: 1 });
adminChatbotLogSchema.index({ createdAt: -1 });

export const AdminChatbotLog = model<IAdminChatbotLog>('AdminChatbotLog', adminChatbotLogSchema);
