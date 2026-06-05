import { Document } from 'mongoose';
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
export declare const AdminChatbotLog: import("mongoose").Model<IAdminChatbotLog, {}, {}, {}, Document<unknown, {}, IAdminChatbotLog, {}, import("mongoose").DefaultSchemaOptions> & IAdminChatbotLog & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IAdminChatbotLog>;
//# sourceMappingURL=admin-chatbot-log.model.d.ts.map