import { Document, Schema, model } from 'mongoose';

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

export interface ISeoCollection extends Document {
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

const seoMetaSchema = new Schema<ISeoMeta>(
  {
    h1: { type: String, default: null },
    meta_title: { type: String, default: null, maxlength: 70 },
    meta_description: { type: String, default: null, maxlength: 160 },
    canonical_url: { type: String, default: null },
    og_title: { type: String, default: null },
    og_description: { type: String, default: null },
    intro_content: { type: String, default: null, maxlength: 5000 },
    conclusion_content: { type: String, default: null, maxlength: 5000 },
  },
  { _id: false }
);

const faqItemSchema = new Schema<ISeoFaqItem>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const SEO_COLLECTION_TYPES: SeoCollectionType[] = [
  'fuel', 'fuel_body_type', 'fuel_budget', 'fuel_body_budget',
  'fuel_feature', 'fuel_transmission', 'fuel_seating', 'fuel_mileage',
  'fuel_usage', 'fuel_safety', 'fuel_family', 'fuel_brand', 'future_custom',
];

const seoCollectionSchema = new Schema<ISeoCollection>(
  {
    collection_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },

    collection_type: { type: String, required: true, enum: SEO_COLLECTION_TYPES },
    primary_keyword: { type: String, default: null },

    fuel_type_ids: [{ type: String }],
    body_type_ids: [{ type: String }],
    brand_ids: [{ type: String }],

    transmission_types: [{ type: String }],
    seating_capacities: [{ type: Number }],
    feature_flags: [{ type: String }],
    mileage_classes: [{ type: String }],

    budget_min: { type: Number, default: null },
    budget_max: { type: Number, default: null },

    usage_intents: [{ type: String }],
    ownership_intents: [{ type: String }],
    safety_intents: [{ type: String }],
    family_intents: [{ type: String }],

    generated_query: { type: Schema.Types.Mixed, default: {} },
    matched_car_count: { type: Number, default: 0 },

    related_collection_ids: [{ type: String }],

    seo: { type: seoMetaSchema, default: () => ({}) },
    faq_items: [faqItemSchema],

    seo_index_status: { type: String, enum: ['index', 'noindex'], default: 'index' },
    auto_noindex: { type: Boolean, default: false },

    health_score: { type: Number, default: 0, min: 0, max: 100 },
    duplicate_risk_score: { type: Number, default: 0, min: 0, max: 100 },
    overlap_percentage: { type: Number, default: 0, min: 0, max: 100 },

    featured_rank: { type: Number, default: null },
    priority_score: { type: Number, default: 0 },

    auto_generated: { type: Boolean, default: false },
    last_refreshed_at: { type: Date, default: null },

    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },

    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },

    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
  },
  { timestamps: true }
);

seoCollectionSchema.index({ status: 1, is_deleted: 1 });
seoCollectionSchema.index({ collection_type: 1, is_deleted: 1 });
seoCollectionSchema.index({ seo_index_status: 1, is_deleted: 1 });
seoCollectionSchema.index({ health_score: 1 });
seoCollectionSchema.index({ priority_score: -1 });
seoCollectionSchema.index({ fuel_type_ids: 1 });
seoCollectionSchema.index({ body_type_ids: 1 });

export const SeoCollection = model<ISeoCollection>('SeoCollection', seoCollectionSchema, 'seo_collection_pages');
