"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatbotAskSchema = void 0;
const zod_1 = require("zod");
const conversationTurnSchema = zod_1.z.object({
    role: zod_1.z.enum(['user', 'assistant']),
    content: zod_1.z.string().max(2000),
});
exports.chatbotAskSchema = zod_1.z.object({
    question: zod_1.z
        .string()
        .min(3, 'Question must be at least 3 characters')
        .max(500, 'Question must be at most 500 characters'),
    sessionId: zod_1.z.string().max(100).optional(),
    context: zod_1.z
        .object({
        currentPage: zod_1.z.string().max(200).optional(),
        role: zod_1.z.string().max(50).optional(),
    })
        .optional(),
    conversationHistory: zod_1.z
        .array(conversationTurnSchema)
        .max(10, 'Conversation history is limited to 10 turns')
        .optional(),
    page: zod_1.z.coerce.number().int().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).optional().default(20),
});
//# sourceMappingURL=adminChatbot.validation.js.map