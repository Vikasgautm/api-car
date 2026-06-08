import type { ChatbotIntent, ChatbotRequestContext } from '../types/adminChatbot.types';

interface IntentRule {
  intent: ChatbotIntent;
  keywords: string[];
}

const INTENT_RULES: IntentRule[] = [
  // Write actions — must be checked FIRST (higher specificity)
  {
    intent: 'action_publish',
    keywords: [
      'publish', 'make live', 'activate', 'go live', 'set live',
      'make it live', 'make active', 'set active', 'enable car', 'enable variant',
    ],
  },
  {
    intent: 'action_unpublish',
    keywords: [
      'unpublish', 'hide car', 'hide variant', 'deactivate', 'take down',
      'make inactive', 'remove from live', 'take offline', 'set inactive',
    ],
  },
  // Name-specific searches
  {
    intent: 'car_name_search',
    keywords: [
      'show me', 'find me', 'look up', 'tell me about', 'details of',
      'what is', 'info on', 'search for', 'get details',
    ],
  },
  {
    intent: 'variant_name_search',
    keywords: [
      'variants of', 'variants for', 'show variants', 'find variants',
      'list variants for', 'what variants',
    ],
  },
  // Dashboard
  {
    intent: 'dashboard_summary',
    keywords: ['dashboard', 'summary', 'overview', 'total count', 'how many', 'statistics', 'stats', 'today'],
  },
  // Car data quality
  {
    intent: 'car_data_quality',
    keywords: [
      'missing brand', 'no variant', 'without variant', 'duplicate slug', 'cars without',
      'missing data', 'car quality', 'invalid car', 'deleted car', 'published car', 'no published variant',
    ],
  },
  // Car search (generic)
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
  // Variant data quality
  {
    intent: 'variant_data_quality',
    keywords: [
      'missing price', 'missing fuel', 'missing body', 'variant quality', 'without fuel',
      'without body', 'invalid variant', 'missing spec', 'unpublished variant',
      'variants without', 'variant missing',
    ],
  },
  // Variant search (generic)
  {
    intent: 'variant_search',
    keywords: ['list all variants', 'all variants', 'search all variants', 'filter variants'],
  },
  // Import
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
  // Taxonomies
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
  // Content
  {
    intent: 'blog_summary',
    keywords: ['blog', 'blogs', 'unpublished blog', 'missing seo', 'blog quality', 'blog content'],
  },
  {
    intent: 'faq_summary',
    keywords: ['faq', 'faqs', 'question', 'answer', 'missing answer', 'duplicate faq', 'unpublished faq'],
  },
  // Users
  {
    intent: 'user_summary',
    keywords: ['user', 'users', 'admin user', 'editor user', 'viewer user', 'logged in', 'recent user', 'active user'],
  },
  // System
  {
    intent: 'system_health',
    keywords: ['system health', 'health check', 'missing data collection', 'collection health', 'slow query', 'db health'],
  },
  {
    intent: 'error_logs',
    keywords: ['error log', 'api error', 'backend error', 'recent error', 'failure log', 'api fail'],
  },
  // New coverage
  {
    intent: 'city_summary',
    keywords: ['city', 'cities', 'location', 'city list', 'show cities'],
  },
  {
    intent: 'ranking_summary',
    keywords: ['ranking', 'rankings', 'rank score', 'popular cars', 'trending cars', 'top cars', 'ranked'],
  },
  {
    intent: 'seo_collection_summary',
    keywords: ['seo collection', 'seo collections', 'collection', 'seo group', 'car collection'],
  },
  {
    intent: 'popular_collection_summary',
    keywords: ['popular collection', 'popular collections', 'curated list', 'buyer guide', 'top picks'],
  },
];

const PAGE_INTENT_BOOST: Record<string, ChatbotIntent[]> = {
  '/variants': ['variant_search', 'variant_data_quality', 'variant_name_search'],
  '/cars': ['car_search', 'car_data_quality', 'car_count', 'car_name_search'],
  '/import': ['import_history', 'unmatched_keys'],
  '/variant-ingestion': ['import_history', 'unmatched_keys'],
  '/brands': ['brand_summary'],
  '/blogs': ['blog_summary'],
  '/faqs': ['faq_summary'],
  '/users': ['user_summary'],
  '/dashboard': ['dashboard_summary'],
  '/fuel-intelligence': ['fuel_type_summary'],
  '/bodytypes': ['body_type_summary'],
  '/cities': ['city_summary'],
  '/rankings': ['ranking_summary'],
  '/seo-collections': ['seo_collection_summary'],
  '/popular-collections': ['popular_collection_summary'],
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

  // Action intents always win if they score > 0 (avoid conflating with searches)
  if ((scores['action_publish'] ?? 0) > 0) return 'action_publish';
  if ((scores['action_unpublish'] ?? 0) > 0) return 'action_unpublish';

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

// Extract a proper-noun entity name from a question
// e.g. "show me Hyundai Creta" → "Hyundai Creta"
// e.g. "publish car Tata Nexon" → "Tata Nexon"
export function extractEntityName(question: string): string | undefined {
  // Remove common lead-in phrases
  const cleaned = question
    .replace(/^(show me|find me|look up|tell me about|details of|what is|info on|search for|get details|publish|unpublish|hide|activate|deactivate|car|variant|the|a)\s+/gi, '')
    .trim();

  // Take first 1-3 words that look like a proper name (start with uppercase or are known car words)
  const words = cleaned.split(/\s+/);
  const nameParts: string[] = [];
  for (const word of words) {
    if (/^[A-Z]/.test(word) || /^[a-z]/i.test(word)) {
      nameParts.push(word);
      if (nameParts.length >= 3) break;
    } else {
      break;
    }
  }

  return nameParts.length > 0 ? nameParts.join(' ') : cleaned.split(/\s+/).slice(0, 2).join(' ') || undefined;
}
