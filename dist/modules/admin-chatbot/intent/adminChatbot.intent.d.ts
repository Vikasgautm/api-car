import type { ChatbotIntent, ChatbotRequestContext } from '../types/adminChatbot.types';
export declare function detectIntent(question: string, context?: ChatbotRequestContext): ChatbotIntent;
export declare function extractEntityName(question: string): string | undefined;
