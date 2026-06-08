import { z } from 'zod';

const conversationTurnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(2000),
});

export const chatbotAskSchema = z.object({
  question: z
    .string()
    .min(3, 'Question must be at least 3 characters')
    .max(500, 'Question must be at most 500 characters'),
  sessionId: z.string().max(100).optional(),
  context: z
    .object({
      currentPage: z.string().max(200).optional(),
      role: z.string().max(50).optional(),
    })
    .optional(),
  conversationHistory: z
    .array(conversationTurnSchema)
    .max(10, 'Conversation history is limited to 10 turns')
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type ChatbotAskInput = z.infer<typeof chatbotAskSchema>;

export const chatbotActionSchema = z.object({
  action: z.enum(['publish', 'unpublish']),
  entity_type: z.enum(['car', 'variant']),
  entity_id: z.string().min(1).max(100),
});

export type ChatbotActionInput = z.infer<typeof chatbotActionSchema>;
