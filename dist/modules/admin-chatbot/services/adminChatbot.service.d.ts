import type { ChatbotRequest, ChatbotResponse, ChatbotActionRequest, ChatbotActionResponse } from '../types/adminChatbot.types';
export declare class AdminChatbotService {
    static ask(req: ChatbotRequest, userId: string, role: string): Promise<ChatbotResponse>;
    static performAction(req: ChatbotActionRequest, userId: string, role: string): Promise<ChatbotActionResponse>;
    private static logRequest;
}
//# sourceMappingURL=adminChatbot.service.d.ts.map