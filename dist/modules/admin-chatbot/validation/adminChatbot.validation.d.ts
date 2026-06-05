import { z } from 'zod';
export declare const chatbotAskSchema: z.ZodObject<{
    question: z.ZodString;
    sessionId: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodObject<{
        currentPage: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    conversationHistory: z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<{
            user: "user";
            assistant: "assistant";
        }>;
        content: z.ZodString;
    }, z.core.$strip>>>;
    page: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
}, z.core.$strip>;
export type ChatbotAskInput = z.infer<typeof chatbotAskSchema>;
//# sourceMappingURL=adminChatbot.validation.d.ts.map