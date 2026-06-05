import type { ChatbotRequest, ChatbotResponse } from '../types/adminChatbot.types';
export declare class AdminChatbotService {
    static ask(req: ChatbotRequest, userId: string, role: string): Promise<ChatbotResponse>;
    private static logRequest;
}
//# sourceMappingURL=adminChatbot.service.d.ts.map