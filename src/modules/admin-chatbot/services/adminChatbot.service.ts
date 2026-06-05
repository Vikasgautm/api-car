import { v4 as uuidv4 } from 'uuid';
import { getCerebrasClient, CHATBOT_MODEL } from '../../../shared/services/cerebras-client';
import { AdminChatbotLog } from '../../../models/admin-chatbot-log.model';
import { detectIntent } from '../intent/adminChatbot.intent';
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
} from './adminChatbot.tools';
import type {
  ChatbotRequest,
  ChatbotResponse,
  ChatbotIntent,
  ToolResult,
  ConversationTurn,
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

async function callTool(
  intent: ChatbotIntent,
  question: string,
  page: number,
  limit: number,
): Promise<ToolResult> {
  const filters = parseChatFilters(question);

  switch (intent) {
    case 'dashboard_summary':
    case 'car_count':
      return getDashboardSummary(page, limit);

    case 'car_data_quality':
      return getCarDataQualityReport(page, limit);

    case 'car_search':
      return searchCars(filters as Parameters<typeof searchCars>[0], page, limit);

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

    default:
      return {
        data: [],
        summary: {},
        fallbackAnswer: 'Unable to understand question. Please ask about cars, variants, imports, users, blogs, or FAQs.',
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
      cerebrasUsed,
      responseTimeMs,
    };
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
