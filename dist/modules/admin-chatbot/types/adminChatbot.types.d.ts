export type ChatbotIntent = 'dashboard_summary' | 'car_search' | 'car_name_search' | 'car_count' | 'car_data_quality' | 'variant_search' | 'variant_name_search' | 'variant_data_quality' | 'brand_summary' | 'fuel_type_summary' | 'body_type_summary' | 'import_history' | 'unmatched_keys' | 'blog_summary' | 'faq_summary' | 'user_summary' | 'system_health' | 'error_logs' | 'city_summary' | 'ranking_summary' | 'seo_collection_summary' | 'popular_collection_summary' | 'action_publish' | 'action_unpublish' | 'unknown';
export type ChatbotWriteAction = 'publish' | 'unpublish';
export type ChatbotActionEntityType = 'car' | 'variant';
export interface ActionProposal {
    action: ChatbotWriteAction;
    entity_type: ChatbotActionEntityType;
    entity_id: string;
    entity_name: string;
    label: string;
    current_state: boolean;
    warning?: string;
}
export interface ChatbotActionRequest {
    action: ChatbotWriteAction;
    entity_type: ChatbotActionEntityType;
    entity_id: string;
}
export interface ChatbotActionResponse {
    success: boolean;
    message: string;
    entity_name: string;
}
export type UserRole = 'viewer' | 'editor' | 'admin' | 'super_admin';
export interface ConversationTurn {
    role: 'user' | 'assistant';
    content: string;
}
export interface ChatbotRequestContext {
    currentPage?: string;
    role?: string;
}
export interface ChatbotRequest {
    question: string;
    sessionId?: string;
    context?: ChatbotRequestContext;
    conversationHistory?: ConversationTurn[];
    page?: number;
    limit?: number;
}
export interface ChatbotSummary {
    total?: number;
    critical?: number;
    warning?: number;
    [key: string]: number | undefined;
}
export interface ChatbotPagination {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
}
export interface ChatbotResponse {
    success: boolean;
    answer: string;
    intent: ChatbotIntent;
    data: Record<string, unknown>[];
    summary: ChatbotSummary;
    suggestions: string[];
    pagination?: ChatbotPagination;
    action_proposal?: ActionProposal;
    cerebrasUsed: boolean;
    responseTimeMs: number;
}
export interface ToolResult {
    data: Record<string, unknown>[];
    summary: ChatbotSummary;
    fallbackAnswer: string;
    action_proposal?: ActionProposal;
}
export declare const ROLE_TOOL_PERMISSIONS: Record<string, ChatbotIntent[]>;
export declare function isIntentAllowedForRole(intent: ChatbotIntent, role: string): boolean;
