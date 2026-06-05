import type { ChatbotIntent, ConversationTurn, ToolResult } from '../types/adminChatbot.types';

export const CHATBOT_SYSTEM_PROMPT = `You are a concise admin assistant for Car Salahakar, an Indian automotive admin panel.
You answer admin questions strictly based on the database data provided to you.
You never invent, estimate, or guess data.

Rules:
- Lead your answer with the count or summary number.
- Be short and direct — 2 to 4 sentences max.
- If the data array is empty, say "No matching records found."
- If a field is missing from the data, say "data unavailable" — never invent a value.
- Highlight critical issues (missing required fields, broken references, duplicate slugs) clearly.
- Suggest 1-3 actionable next steps relevant to what was found.
- Never expose database credentials, tokens, passwords, or environment variables.
- Never run or suggest running any code or database queries.
- Respond in plain text only — no markdown, no code blocks.`;

export function buildChatbotUserMessage(
  question: string,
  intent: ChatbotIntent,
  toolResult: ToolResult,
  page: number,
  limit: number,
): string {
  const { data, summary, fallbackAnswer } = toolResult;

  const summaryLines = Object.entries(summary)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  const dataPreview =
    data.length > 0
      ? `\nSample data (${data.length} of ${summary.total ?? data.length} rows, page ${page}, limit ${limit}):\n${JSON.stringify(data.slice(0, 10), null, 2)}`
      : '\nNo data rows returned.';

  return `Admin question: ${question}
Detected intent: ${intent}
Database summary: ${summaryLines || 'none'}
${dataPreview}
Fallback answer if you cannot respond: ${fallbackAnswer}

Answer the admin question concisely using only the data above. Do not invent any values.`;
}

export function buildConversationMessages(
  history: ConversationTurn[],
  newUserMessage: string,
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: CHATBOT_SYSTEM_PROMPT },
  ];

  // Include last 5 turns for context
  const recentHistory = history.slice(-10);
  for (const turn of recentHistory) {
    messages.push({ role: turn.role, content: turn.content });
  }

  messages.push({ role: 'user', content: newUserMessage });
  return messages;
}
