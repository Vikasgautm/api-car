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
export declare const chatbotActionSchema: z.ZodObject<{
    action: z.ZodEnum<{
        publish: "publish";
        unpublish: "unpublish";
    }>;
    entity_type: z.ZodEnum<{
        car: "car";
        variant: "variant";
    }>;
    entity_id: z.ZodString;
}, z.core.$strip>;
export type ChatbotActionInput = z.infer<typeof chatbotActionSchema>;
