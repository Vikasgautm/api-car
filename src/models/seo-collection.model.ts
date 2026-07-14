export type SeoCollectionType =
  | 'fuel'
  | 'fuel_body_type'
  | 'fuel_budget'
  | 'fuel_body_budget'
  | 'fuel_feature'
  | 'fuel_transmission'
  | 'fuel_seating'
  | 'fuel_mileage'
  | 'fuel_usage'
  | 'fuel_safety'
  | 'fuel_family'
  | 'fuel_brand'
  | 'future_custom';

export type SeoIndexStatus = 'index' | 'noindex';
export type SeoCollectionStatus = 'draft' | 'published' | 'archived';

export interface ISeoFaqItem {
  question: string;
  answer: string;
}

export interface ISeoMeta {
  h1?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  intro_content?: string | null;
  conclusion_content?: string | null;
}

export interface ISeoCollection  {
  collection_id: string;
  title: string;
  slug: string;

  collection_type: SeoCollectionType;
  primary_keyword?: string | null;

  fuel_type_ids: string[];
  body_type_ids: string[];
  brand_ids: string[];

  transmission_types: string[];
  seating_capacities: number[];
  feature_flags: string[];
  mileage_classes: string[];

  budget_min?: number | null;
  budget_max?: number | null;

  usage_intents: string[];
  ownership_intents: string[];
  safety_intents: string[];
  family_intents: string[];

  generated_query: Record<string, any>;
  matched_car_count: number;

  related_collection_ids: string[];

  seo: ISeoMeta;
  faq_items: ISeoFaqItem[];

  seo_index_status: SeoIndexStatus;
  auto_noindex: boolean;

  health_score: number;
  duplicate_risk_score: number;
  overlap_percentage: number;

  featured_rank?: number | null;
  priority_score: number;

  auto_generated: boolean;
  last_refreshed_at?: Date | null;

  status: SeoCollectionStatus;

  is_deleted: boolean;
  deleted_at?: Date | null;

  created_by?: string | null;
  updated_by?: string | null;
}

import { BaseModel } from '../sql/common/BaseModel';
export const SeoCollection = new BaseModel<ISeoCollection>('SeoCollections', 'collection_id', ['filter_criteria']);
