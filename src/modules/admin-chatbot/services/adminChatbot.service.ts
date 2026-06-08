import { v4 as uuidv4 } from 'uuid';
import { getCerebrasClient, CHATBOT_MODEL } from '../../../shared/services/cerebras-client';
import { AdminChatbotLog } from '../../../models/admin-chatbot-log.model';
import { detectIntent, extractEntityName } from '../intent/adminChatbot.intent';
import { buildChatbotUserMessage, buildConversationMessages } from '../prompt/adminChatbot.prompt';
import {
  getDashboardSummary,
  searchCars,
  getCarDataQualityReport,
  searchVariants,
  getVariantDataQualityReport,
  getBrandsSummary,
  getFuelTypesSummary,
  getBodyTypesSummary,
  getImportHistory,
  getUnmatchedImportKeys,
  getBlogsSummary,
  getFAQsSummary,
  getUsersSummary,
  getRecentErrors,
  getSystemHealth,
  searchByCarName,
  searchByVariantName,
  findCarForAction,
  findVariantForAction,
  getCitySummary,
  getRankingSummary,
  getSeoCollectionSummary,
  getPopularCollectionSummary,
  performWriteAction,
} from './adminChatbot.tools';
import type {
  ChatbotRequest,
  ChatbotResponse,
  ChatbotIntent,
  ToolResult,
  ConversationTurn,
  ChatbotActionRequest,
  ChatbotActionResponse,
} from '../types/adminChatbot.types';
import { isIntentAllowedForRole } from '../types/adminChatbot.types';
import { AppError } from '../../../shared/utils/app-error.util';

const CEREBRAS_TIMEOUT_MS = 15_000;
const CHATBOT_ENABLED = process.env.ADMIN_CHATBOT_ENABLED !== 'false';

function parseChatFilters(question: string): Record<string, unknown> {
  const q = question.toLowerCase();
  const filters: Record<string, unknown> = {};
  if (q.includes('unpublish')) filters.is_published = false;
  if (q.includes('published') && !q.includes('unpublish')) filters.is_published = true;
  if (q.includes('deleted')) filters.is_deleted = true;
  if (q.includes('missing price') || q.includes('no price')) filters.missingPrice = true;
  if (q.includes('missing fuel') || q.includes('no fuel')) filters.missingFuelType = true;
  if (q.includes('missing body') || q.includes('no body')) filters.missingBodyType = true;
  return filters;
}

function extractCarName(question: string): string | undefined {
  // Match "variants of Tata Punch" or "Tata Punch variants"
  const match = question.match(/variants\s+(?:of|for)\s+([A-Za-z\s]+?)(?:\s+variants?)?$/i)
    || question.match(/show\s+([A-Za-z\s]+?)\s+variants/i);
  return match?.[1]?.trim();
}

function buildSuggestions(intent: ChatbotIntent, summary: Record<string, number | undefined>): string[] {
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

async function callTool(
  intent: ChatbotIntent,
  question: string,
  page: number,
  limit: number,
): Promise<ToolResult> {
  const filters = parseChatFilters(question);
  const entityName = extractEntityName(question);

  switch (intent) {
    case 'dashboard_summary':
    case 'car_count':
      return getDashboardSummary(page, limit);

    case 'car_data_quality':
      return getCarDataQualityReport(page, limit);

    case 'car_search':
      return searchCars(filters as Parameters<typeof searchCars>[0], page, limit);

    case 'car_name_search':
      return entityName
        ? searchByCarName(entityName, page, limit)
        : searchCars(filters as Parameters<typeof searchCars>[0], page, limit);

    case 'variant_data_quality':
      return getVariantDataQualityReport(page, limit);

    case 'variant_search': {
      const carName = extractCarName(question);
      return searchVariants(
        { ...filters, ...(carName ? { car_name: carName } : {}) } as Parameters<typeof searchVariants>[0],
        page,
        limit,
      );
    }

    case 'variant_name_search':
      return entityName
        ? searchByVariantName(entityName, undefined, page, limit)
        : searchVariants(filters as Parameters<typeof searchVariants>[0], page, limit);

    case 'action_publish':
      if (!entityName) {
        return { data: [], summary: {}, fallbackAnswer: 'Please specify the car or variant name to publish.' };
      }
      // Try car first, then variant
      {
        const carResult = await findCarForAction(entityName, 'publish');
        if (carResult.data.length > 0) return carResult;
        return findVariantForAction(entityName, 'publish');
      }

    case 'action_unpublish':
      if (!entityName) {
        return { data: [], summary: {}, fallbackAnswer: 'Please specify the car or variant name to unpublish.' };
      }
      {
        const carResult = await findCarForAction(entityName, 'unpublish');
        if (carResult.data.length > 0) return carResult;
        return findVariantForAction(entityName, 'unpublish');
      }

    case 'brand_summary':
      return getBrandsSummary(page, limit);

    case 'fuel_type_summary':
      return getFuelTypesSummary(page, limit);

    case 'body_type_summary':
      return getBodyTypesSummary(page, limit);

    case 'import_history':
      return getImportHistory(page, limit);

    case 'unmatched_keys':
      return getUnmatchedImportKeys(page, limit);

    case 'blog_summary':
      return getBlogsSummary(page, limit);

    case 'faq_summary':
      return getFAQsSummary(page, limit);

    case 'user_summary':
      return getUsersSummary(page, limit);

    case 'error_logs':
      return getRecentErrors(page, limit);

    case 'system_health':
      return getSystemHealth(page, limit);

    case 'city_summary':
      return getCitySummary(page, limit);

    case 'ranking_summary':
      return getRankingSummary(page, limit);

    case 'seo_collection_summary':
      return getSeoCollectionSummary(page, limit);

    case 'popular_collection_summary':
      return getPopularCollectionSummary(page, limit);

    default:
      return {
        data: [],
        summary: {},
        fallbackAnswer: 'Unable to understand question. Please ask about cars, variants, imports, users, blogs, rankings, cities, or collections.',
      };
  }
}

async function callCerebrasWithTimeout(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
): Promise<string> {
  const client = getCerebrasClient();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CEREBRAS_TIMEOUT_MS);

  try {
    const response = await (client.chat.completions.create as Function)({
      model: CHATBOT_MODEL,
      max_tokens: 512,
      messages,
    });
    return (response as { choices: Array<{ message: { content: string } }> })
      .choices[0]?.message?.content?.trim() ?? '';
  } finally {
    clearTimeout(timer);
  }
}

export class AdminChatbotService {
  static async ask(req: ChatbotRequest, userId: string, role: string): Promise<ChatbotResponse> {
    if (!CHATBOT_ENABLED) {
      throw new AppError('Admin chatbot is currently disabled.', 403);
    }

    const startTime = Date.now();
    const page = Math.max(1, req.page ?? 1);
    const limit = Math.min(Number(process.env.ADMIN_CHATBOT_MAX_RESULTS) || 20, 50);

    const intent = detectIntent(req.question, req.context);

    // Role-based permission check
    if (!isIntentAllowedForRole(intent, role)) {
      await AdminChatbotService.logRequest({
        userId, role, question: req.question, intent,
        toolUsed: null, answer: '', dataRows: 0,
        responseTimeMs: Date.now() - startTime,
        cerebrasUsed: false, status: 'permission_denied',
        sessionId: req.sessionId ?? null,
        currentPage: req.context?.currentPage ?? null,
      });
      throw new AppError('This question needs admin permission.', 403);
    }

    let toolResult: ToolResult;
    try {
      toolResult = await callTool(intent, req.question, page, limit);
    } catch (toolErr: unknown) {
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
      throw new AppError('Failed to fetch data. Please try again.', 500);
    }

    const userMessage = buildChatbotUserMessage(req.question, intent, toolResult, page, limit);
    const history: ConversationTurn[] = req.conversationHistory ?? [];
    const messages = buildConversationMessages(history, userMessage);

    let answer = toolResult.fallbackAnswer;
    let cerebrasUsed = false;
    let status: 'success' | 'fallback' = 'fallback';

    try {
      const cerebrasAnswer = await callCerebrasWithTimeout(messages);
      if (cerebrasAnswer) {
        answer = cerebrasAnswer;
        cerebrasUsed = true;
        status = 'success';
      }
    } catch {
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
      suggestions: buildSuggestions(intent, toolResult.summary as Record<string, number | undefined>),
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

  static async performAction(req: ChatbotActionRequest, userId: string, role: string): Promise<ChatbotActionResponse> {
    if (!CHATBOT_ENABLED) throw new AppError('Admin chatbot is currently disabled.', 403);

    if (!['admin', 'super_admin', 'editor'].includes(role)) {
      throw new AppError('You do not have permission to perform write actions.', 403);
    }

    const result = await performWriteAction(req.action, req.entity_type, req.entity_id);
    return result;
  }

  private static async logRequest(params: {
    userId: string;
    role: string;
    question: string;
    intent: string;
    toolUsed: string | null;
    answer: string;
    dataRows: number;
    responseTimeMs: number;
    cerebrasUsed: boolean;
    status: 'success' | 'fallback' | 'error' | 'permission_denied';
    errorMessage?: string;
    sessionId: string | null;
    currentPage: string | null;
  }): Promise<void> {
    try {
      await AdminChatbotLog.create({
        log_id: uuidv4(),
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
    } catch {
      // Logging failure must never break the response
    }
  }
}
