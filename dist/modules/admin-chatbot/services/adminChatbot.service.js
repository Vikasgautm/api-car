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
            return ['Open cars page', 'Find variants with missing price', 'Show unmatched import keys'];
        case 'car_search':
            return ['Open cars page', 'Find cars with missing data', 'Find variants for these cars'];
        case 'variant_data_quality':
            return ['Open variants page', 'Find cars with no variants', 'Export result'];
        case 'variant_search':
            return ['Open variants page', 'Find variants with missing price'];
        case 'import_history':
            return ['Show unmatched import keys', 'Open imports page', 'Show failed imports'];
        case 'unmatched_keys':
            return ['Open imports page', 'Show import history', 'Re-import affected records'];
        case 'brand_summary':
            return ['Open brands page', 'Show cars without brand'];
        case 'fuel_type_summary':
            return ['Open fuel types page', 'Find variants missing fuel type'];
        case 'body_type_summary':
            return ['Open body types page', 'Find variants missing body type'];
        case 'blog_summary':
            return ['Open blogs page', 'Find blogs with missing SEO title'];
        case 'faq_summary':
            return ['Open FAQs page', 'Find FAQs with missing answers'];
        case 'user_summary':
            return ['Open users page'];
        case 'system_health':
            return ['Show recent errors', 'Find cars with missing data', 'Show unmatched import keys'];
        case 'error_logs':
            return ['Open audit page', 'Show import history', 'Show system health'];
        default:
            return ['Show dashboard summary', 'Find cars with missing data', 'Show recent errors'];
    }
}
async function callTool(intent, question, page, limit) {
    const filters = parseChatFilters(question);
    switch (intent) {
        case 'dashboard_summary':
        case 'car_count':
            return (0, adminChatbot_tools_1.getDashboardSummary)(page, limit);
        case 'car_data_quality':
            return (0, adminChatbot_tools_1.getCarDataQualityReport)(page, limit);
        case 'car_search':
            return (0, adminChatbot_tools_1.searchCars)(filters, page, limit);
        case 'variant_data_quality':
            return (0, adminChatbot_tools_1.getVariantDataQualityReport)(page, limit);
        case 'variant_search': {
            const carName = extractCarName(question);
            return (0, adminChatbot_tools_1.searchVariants)({ ...filters, ...(carName ? { car_name: carName } : {}) }, page, limit);
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
        default:
            return {
                data: [],
                summary: {},
                fallbackAnswer: 'Unable to understand question. Please ask about cars, variants, imports, users, blogs, or FAQs.',
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
            cerebrasUsed,
            responseTimeMs,
        };
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