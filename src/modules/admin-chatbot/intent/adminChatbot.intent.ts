import type { ChatbotIntent, ChatbotRequestContext } from '../types/adminChatbot.types';

interface IntentRule {
  intent: ChatbotIntent;
  keywords: string[];
}

const INTENT_RULES: IntentRule[] = [
  {
    intent: 'dashboard_summary',
    keywords: ['dashboard', 'summary', 'overview', 'total count', 'how many', 'statistics', 'stats', 'today'],
  },
  {
    intent: 'car_data_quality',
    keywords: [
      'missing brand', 'no variant', 'without variant', 'duplicate slug', 'cars without',
      'missing data', 'car quality', 'invalid car', 'deleted car', 'published car', 'no published variant',
    ],
  },
  {
    intent: 'car_search',
    keywords: [
      'show cars', 'find cars', 'list cars', 'unpublished cars', 'cars added',
      'deleted cars', 'search car', 'which cars',
    ],
  },
  {
    intent: 'car_count',
    keywords: ['how many cars', 'count cars', 'total cars', 'number of cars'],
  },
  {
    intent: 'variant_data_quality',
    keywords: [
      'missing price', 'missing fuel', 'missing body', 'variant quality', 'without fuel',
      'without body', 'invalid variant', 'missing spec', 'unpublished variant',
      'variants without', 'variant missing',
    ],
  },
  {
    intent: 'variant_search',
    keywords: [
      'show variants', 'find variants', 'list variants', 'which variants', 'search variant',
      'variants of', 'variants for',
    ],
  },
  {
    intent: 'unmatched_keys',
    keywords: [
      'unmatched', 'unmatched key', 'unmapped', 'import key', 'import issue',
      'cardekho issue', 'carwale issue', 'specs unmapped', 'spec not matched',
    ],
  },
  {
    intent: 'import_history',
    keywords: [
      'import history', 'last imported', 'import log', 'failed import', 'import status',
      'recent import', 'import error', 'import fail',
    ],
  },
  {
    intent: 'brand_summary',
    keywords: ['brand', 'brands', 'no cars brand', 'unused brand', 'brand list'],
  },
  {
    intent: 'fuel_type_summary',
    keywords: ['fuel type', 'fuel types', 'unused fuel', 'petrol', 'diesel', 'electric', 'cng', 'hybrid'],
  },
  {
    intent: 'body_type_summary',
    keywords: ['body type', 'body types', 'unused body', 'suv', 'sedan', 'hatchback', 'mpv'],
  },
  {
    intent: 'blog_summary',
    keywords: ['blog', 'blogs', 'unpublished blog', 'missing seo', 'blog quality', 'blog content'],
  },
  {
    intent: 'faq_summary',
    keywords: ['faq', 'faqs', 'question', 'answer', 'missing answer', 'duplicate faq', 'unpublished faq'],
  },
  {
    intent: 'user_summary',
    keywords: ['user', 'users', 'admin user', 'editor user', 'viewer user', 'logged in', 'recent user', 'active user'],
  },
  {
    intent: 'system_health',
    keywords: ['system health', 'health check', 'missing data collection', 'collection health', 'slow query', 'db health'],
  },
  {
    intent: 'error_logs',
    keywords: ['error log', 'api error', 'backend error', 'recent error', 'failure log', 'api fail'],
  },
];

const PAGE_INTENT_BOOST: Record<string, ChatbotIntent[]> = {
  '/variants': ['variant_search', 'variant_data_quality'],
  '/cars': ['car_search', 'car_data_quality', 'car_count'],
  '/imports': ['import_history', 'unmatched_keys'],
  '/brands': ['brand_summary'],
  '/blogs': ['blog_summary'],
  '/faqs': ['faq_summary'],
  '/users': ['user_summary'],
  '/dashboard': ['dashboard_summary'],
  '/fuel-types': ['fuel_type_summary'],
  '/body-types': ['body_type_summary'],
};

export function detectIntent(question: string, context?: ChatbotRequestContext): ChatbotIntent {
  const q = question.toLowerCase();

  const scores: Partial<Record<ChatbotIntent, number>> = {};

  for (const rule of INTENT_RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (q.includes(kw)) score += 1;
    }
    if (score > 0) scores[rule.intent] = (scores[rule.intent] ?? 0) + score;
  }

  // Boost intents matching the current page
  if (context?.currentPage) {
    const page = context.currentPage.split('?')[0];
    for (const [path, boostedIntents] of Object.entries(PAGE_INTENT_BOOST)) {
      if (page.startsWith(path)) {
        for (const intent of boostedIntents) {
          if (scores[intent] !== undefined) scores[intent]! += 2;
        }
      }
    }
  }

  let bestIntent: ChatbotIntent = 'unknown';
  let bestScore = 0;
  for (const [intent, score] of Object.entries(scores) as [ChatbotIntent, number][]) {
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  return bestIntent;
}
