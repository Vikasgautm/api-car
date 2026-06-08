"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminChatbotService = void 0;
const uuid_1 = require("uuid");
const cerebras_client_1 = require("../../../shared/services/cerebras-client");
const admin_chatbot_log_model_1 = require("../../../models/admin-chatbot-log.model");
const adminChatbot_intent_1 = require("../intent/adminChatbot.intent");
const adminChatbot_prompt_1 = require("../prompt/adminChatbot.prompt");
const adminChatbot_tools_1 = require("./adminChatbot.tools");
const adminChatbot_types_1 = require("../types/adminChatbot.types");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const CEREBRAS_TIMEOUT_MS = 15_000;
const CHATBOT_ENABLED = process.env.ADMIN_CHATBOT_ENABLED !== 'false';
function parseChatFilters(question) {
    const q = question.toLowerCase();
    const filters = {};
    if (q.includes('unpublish'))
        filters.is_published = false;
    if (q.includes('published') && !q.includes('unpublish'))
        filters.is_published = true;
    if (q.includes('deleted'))
        filters.is_deleted = true;
    if (q.includes('missing price') || q.includes('no price'))
        filters.missingPrice = true;
    if (q.includes('missing fuel') || q.includes('no fuel'))
        filters.missingFuelType = true;
    if (q.includes('missing body') || q.includes('no body'))
        filters.missingBodyType = true;
    return filters;
}
function extractCarName(question) {
    // Match "variants of Tata Punch" or "Tata Punch variants"
    const match = question.match(/variants\s+(?:of|for)\s+([A-Za-z\s]+?)(?:\s+variants?)?$/i)
        || question.match(/show\s+([A-Za-z\s]+?)\s+variants/i);
    return match?.[1]?.trim();
}
function buildSuggestions(intent, summary) {
    switch (intent) {
        case 'dashboard_summary':
            return ['Find cars with missing data', 'Find variants with missing price', 'Show unpublished cars'];
        case 'car_data_quality':
            return ['Find variants with missing price', 'Show unmatched import keys', 'Show system health'];
        case 'car_search':
        case 'car_name_search':
            return ['Find cars with missing data', 'Show unpublished cars', 'Find variants with missing price'];
        case 'variant_data_quality':
            return ['Find cars with no variants', 'Show unmatched import keys', 'Export result'];
        case 'variant_search':
        case 'variant_name_search':
            return ['Find variants with missing price', 'Find variants missing fuel type'];
        case 'import_history':
            return ['Show unmatched import keys', 'Show failed imports', 'Show system health'];
        case 'unmatched_keys':
            return ['Show import history', 'Show system health', 'Find cars with missing data'];
        case 'brand_summary':
            return ['Show cars without brand', 'Show all brands', 'Find cars with missing data'];
        case 'fuel_type_summary':
            return ['Find variants missing fuel type', 'Show variant data quality'];
        case 'body_type_summary':
            return ['Find variants missing body type', 'Show variant data quality'];
        case 'blog_summary':
            return ['Find blogs with missing SEO title', 'Show unpublished blogs'];
        case 'faq_summary':
            return ['Find FAQs with missing answers', 'Show unpublished FAQs'];
        case 'user_summary':
            return ['Show admin users', 'Show active users', 'Show system health'];
        case 'system_health':
            return ['Show recent errors', 'Find cars with missing data', 'Show unmatched import keys'];
        case 'error_logs':
            return ['Show import history', 'Show system health', 'Show dashboard summary'];
        case 'city_summary':
            return ['Show inactive cities', 'Show dashboard summary'];
        case 'ranking_summary':
            return ['Show popular collections', 'Show SEO collections', 'Find cars with missing data'];
        case 'seo_collection_summary':
            return ['Show popular collections', 'Show ranking summary', 'Find cars with missing data'];
        case 'popular_collection_summary':
            return ['Show SEO collections', 'Show ranking summary', 'Show dashboard summary'];
        case 'action_publish':
        case 'action_unpublish':
            return ['Show dashboard summary', 'Find cars with missing data', 'Show system health'];
        default:
            return ['Show dashboard summary', 'Find cars with missing data', 'Show recent errors'];
    }
}
async function callTool(intent, question, page, limit) {
    const filters = parseChatFilters(question);
    const entityName = (0, adminChatbot_intent_1.extractEntityName)(question);
    switch (intent) {
        case 'dashboard_summary':
        case 'car_count':
            return (0, adminChatbot_tools_1.getDashboardSummary)(page, limit);
        case 'car_data_quality':
            return (0, adminChatbot_tools_1.getCarDataQualityReport)(page, limit);
        case 'car_search':
            return (0, adminChatbot_tools_1.searchCars)(filters, page, limit);
        case 'car_name_search':
            return entityName
                ? (0, adminChatbot_tools_1.searchByCarName)(entityName, page, limit)
                : (0, adminChatbot_tools_1.searchCars)(filters, page, limit);
        case 'variant_data_quality':
            return (0, adminChatbot_tools_1.getVariantDataQualityReport)(page, limit);
        case 'variant_search': {
            const carName = extractCarName(question);
            return (0, adminChatbot_tools_1.searchVariants)({ ...filters, ...(carName ? { car_name: carName } : {}) }, page, limit);
        }
        case 'variant_name_search':
            return entityName
                ? (0, adminChatbot_tools_1.searchByVariantName)(entityName, undefined, page, limit)
                : (0, adminChatbot_tools_1.searchVariants)(filters, page, limit);
        case 'action_publish':
            if (!entityName) {
                return { data: [], summary: {}, fallbackAnswer: 'Please specify the car or variant name to publish.' };
            }
            // Try car first, then variant
            {
                const carResult = await (0, adminChatbot_tools_1.findCarForAction)(entityName, 'publish');
                if (carResult.data.length > 0)
                    return carResult;
                return (0, adminChatbot_tools_1.findVariantForAction)(entityName, 'publish');
            }
        case 'action_unpublish':
            if (!entityName) {
                return { data: [], summary: {}, fallbackAnswer: 'Please specify the car or variant name to unpublish.' };
            }
            {
                const carResult = await (0, adminChatbot_tools_1.findCarForAction)(entityName, 'unpublish');
                if (carResult.data.length > 0)
                    return carResult;
                return (0, adminChatbot_tools_1.findVariantForAction)(entityName, 'unpublish');
            }
        case 'brand_summary':
            return (0, adminChatbot_tools_1.getBrandsSummary)(page, limit);
        case 'fuel_type_summary':
            return (0, adminChatbot_tools_1.getFuelTypesSummary)(page, limit);
        case 'body_type_summary':
            return (0, adminChatbot_tools_1.getBodyTypesSummary)(page, limit);
        case 'import_history':
            return (0, adminChatbot_tools_1.getImportHistory)(page, limit);
        case 'unmatched_keys':
            return (0, adminChatbot_tools_1.getUnmatchedImportKeys)(page, limit);
        case 'blog_summary':
            return (0, adminChatbot_tools_1.getBlogsSummary)(page, limit);
        case 'faq_summary':
            return (0, adminChatbot_tools_1.getFAQsSummary)(page, limit);
        case 'user_summary':
            return (0, adminChatbot_tools_1.getUsersSummary)(page, limit);
        case 'error_logs':
            return (0, adminChatbot_tools_1.getRecentErrors)(page, limit);
        case 'system_health':
            return (0, adminChatbot_tools_1.getSystemHealth)(page, limit);
        case 'city_summary':
            return (0, adminChatbot_tools_1.getCitySummary)(page, limit);
        case 'ranking_summary':
            return (0, adminChatbot_tools_1.getRankingSummary)(page, limit);
        case 'seo_collection_summary':
            return (0, adminChatbot_tools_1.getSeoCollectionSummary)(page, limit);
        case 'popular_collection_summary':
            return (0, adminChatbot_tools_1.getPopularCollectionSummary)(page, limit);
        default:
            return {
                data: [],
                summary: {},
                fallbackAnswer: 'Unable to understand question. Please ask about cars, variants, imports, users, blogs, rankings, cities, or collections.',
            };
    }
}
async function callCerebrasWithTimeout(messages) {
    const client = (0, cerebras_client_1.getCerebrasClient)();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CEREBRAS_TIMEOUT_MS);
    try {
        const response = await client.chat.completions.create({
            model: cerebras_client_1.CHATBOT_MODEL,
            max_tokens: 512,
            messages,
        });
        return response
            .choices[0]?.message?.content?.trim() ?? '';
    }
    finally {
        clearTimeout(timer);
    }
}
class AdminChatbotService {
    static async ask(req, userId, role) {
        if (!CHATBOT_ENABLED) {
            throw new app_error_util_1.AppError('Admin chatbot is currently disabled.', 403);
        }
        const startTime = Date.now();
        const page = Math.max(1, req.page ?? 1);
        const limit = Math.min(Number(process.env.ADMIN_CHATBOT_MAX_RESULTS) || 20, 50);
        const intent = (0, adminChatbot_intent_1.detectIntent)(req.question, req.context);
        // Role-based permission check
        if (!(0, adminChatbot_types_1.isIntentAllowedForRole)(intent, role)) {
            await AdminChatbotService.logRequest({
                userId, role, question: req.question, intent,
                toolUsed: null, answer: '', dataRows: 0,
                responseTimeMs: Date.now() - startTime,
                cerebrasUsed: false, status: 'permission_denied',
                sessionId: req.sessionId ?? null,
                currentPage: req.context?.currentPage ?? null,
            });
            throw new app_error_util_1.AppError('This question needs admin permission.', 403);
        }
        let toolResult;
        try {
            toolResult = await callTool(intent, req.question, page, limit);
        }
        catch (toolErr) {
            const msg = toolErr instanceof Error ? toolErr.message : 'Tool error';
            await AdminChatbotService.logRequest({
                userId, role, question: req.question, intent,
                toolUsed: intent, answer: msg, dataRows: 0,
                responseTimeMs: Date.now() - startTime,
                cerebrasUsed: false, status: 'error',
                errorMessage: msg,
                sessionId: req.sessionId ?? null,
                currentPage: req.context?.currentPage ?? null,
            });
            throw new app_error_util_1.AppError('Failed to fetch data. Please try again.', 500);
        }
        const userMessage = (0, adminChatbot_prompt_1.buildChatbotUserMessage)(req.question, intent, toolResult, page, limit);
        const history = req.conversationHistory ?? [];
        const messages = (0, adminChatbot_prompt_1.buildConversationMessages)(history, userMessage);
        let answer = toolResult.fallbackAnswer;
        let cerebrasUsed = false;
        let status = 'fallback';
        try {
            const cerebrasAnswer = await callCerebrasWithTimeout(messages);
            if (cerebrasAnswer) {
                answer = cerebrasAnswer;
                cerebrasUsed = true;
                status = 'success';
            }
        }
        catch {
            // Cerebras failed — use fallback answer from DB result (already set above)
            answer = `[Database result] ${toolResult.fallbackAnswer}`;
        }
        const responseTimeMs = Date.now() - startTime;
        await AdminChatbotService.logRequest({
            userId, role, question: req.question, intent,
            toolUsed: intent, answer, dataRows: toolResult.data.length,
            responseTimeMs, cerebrasUsed, status,
            sessionId: req.sessionId ?? null,
            currentPage: req.context?.currentPage ?? null,
        });
        const total = toolResult.summary.total ?? toolResult.data.length;
        return {
            success: true,
            answer,
            intent,
            data: toolResult.data,
            summary: toolResult.summary,
            suggestions: buildSuggestions(intent, toolResult.summary),
            pagination: {
                page,
                limit,
                total,
                hasMore: page * limit < total,
            },
            action_proposal: toolResult.action_proposal,
            cerebrasUsed,
            responseTimeMs,
        };
    }
    static async performAction(req, userId, role) {
        if (!CHATBOT_ENABLED)
            throw new app_error_util_1.AppError('Admin chatbot is currently disabled.', 403);
        if (!['admin', 'super_admin', 'editor'].includes(role)) {
            throw new app_error_util_1.AppError('You do not have permission to perform write actions.', 403);
        }
        const result = await (0, adminChatbot_tools_1.performWriteAction)(req.action, req.entity_type, req.entity_id);
        return result;
    }
    static async logRequest(params) {
        try {
            await admin_chatbot_log_model_1.AdminChatbotLog.create({
                log_id: (0, uuid_1.v4)(),
                user_id: params.userId,
                role: params.role,
                question: params.question.substring(0, 500),
                intent: params.intent,
                tool_used: params.toolUsed,
                answer_length: params.answer.length,
                data_rows_returned: params.dataRows,
                response_time_ms: params.responseTimeMs,
                cerebras_used: params.cerebrasUsed,
                status: params.status,
                error_message: params.errorMessage ?? null,
                session_id: params.sessionId,
                current_page: params.currentPage,
            });
        }
        catch {
            // Logging failure must never break the response
        }
    }
}
exports.AdminChatbotService = AdminChatbotService;
//# sourceMappingURL=adminChatbot.service.js.map