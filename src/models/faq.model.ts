export type AnswerFormat = 'text' | 'html' | 'markdown';

export type FAQType =
  | 'editorial'
  | 'specification'
  | 'feature'
  | 'performance'
  | 'safety'
  | 'dimensions'
  | 'comparison'
  | 'ownership'
  | 'upcoming'
  | 'collection'
  | 'aggregation';

export type FAQEntityType =
  | 'car'
  | 'variant'
  | 'brand'
  | 'body_type'
  | 'fuel_type'
  | 'comparison'
  | 'seo_collection'
  | 'global';

export type FAQPageType =
  | 'homepage'
  | 'new_cars_page'
  | 'upcoming_cars_page'
  | 'brand_page'
  | 'body_type_page'
  | 'fuel_type_page'
  | 'car_page'
  | 'car_overview_page'
  | 'variant_page'
  | 'variant_overview_page'
  | 'specs_page'
  | 'feature_page'
  | 'comparison_page'
  | 'seo_collection_page'
  | 'budget_page'
  | 'safety_page'
  | 'family_page';

export type FAQVisibilityStatus = 'visible' | 'hidden' | 'scheduled';
export type FAQSourceType = 'manual' | 'template' | 'ai' | 'import';

export interface FAQRelatedEntity {
  entity_type: FAQEntityType;
  entity_id: string;
}

export interface IFAQ  {
  faq_id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  tags?: string[];
  answer_format: AnswerFormat;
  faq_group?: string;
  related_cars?: string[];
  related_brands?: string[];
  related_blogs?: string[];
  is_published: boolean;
  is_deleted: boolean;
  is_featured: boolean;
  slug: string;
  view_count?: number;

  // Intelligence fields
  faq_type: FAQType;
  intent_type?: string;

  // Entity mapping
  entity_type?: FAQEntityType;
  entity_id?: string;
  related_entities?: FAQRelatedEntity[];

  // Page targeting
  target_page_types?: FAQPageType[];

  // Template support
  template_key?: string;
  is_dynamic: boolean;
  is_editorial: boolean;
  source_type: FAQSourceType;

  // SEO / deduplication
  canonical_intent_key?: string;
  normalized_question?: string;
  indexable: boolean;
  schema_enabled: boolean;

  // Scoring
  priority_score: number;
  freshness_score: number;
  faq_health_score: number;

  // Status
  visibility_status: FAQVisibilityStatus;
  needs_refresh: boolean;
  last_reviewed_at?: Date;

  // Analytics
  click_count?: number;
}

import { BaseModel } from '../sql/common/BaseModel';
export const FAQ = new BaseModel<IFAQ>('FAQs', 'faq_id');
