import { Document, Schema, model } from 'mongoose';

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

export interface IFAQ extends Document {
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

const faqSchema = new Schema<IFAQ>(
  {
    faq_id: { type: String, required: true, unique: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, required: true },
    order: { type: Number, default: 0 },
    tags: { type: [String] },
    answer_format: {
      type: String,
      enum: ['text', 'html', 'markdown'],
      default: 'text',
    },
    faq_group: { type: String },
    related_cars: [{ type: String }],
    related_brands: [{ type: String }],
    related_blogs: [{ type: String }],
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    slug: { type: String, required: true, unique: true },
    view_count: { type: Number, default: 0 },

    // Intelligence
    faq_type: {
      type: String,
      enum: ['editorial', 'specification', 'feature', 'performance', 'safety', 'dimensions', 'comparison', 'ownership', 'upcoming', 'collection', 'aggregation'],
      default: 'editorial',
    },
    intent_type: { type: String },

    // Entity mapping
    entity_type: {
      type: String,
      enum: ['car', 'variant', 'brand', 'body_type', 'fuel_type', 'comparison', 'seo_collection', 'global'],
    },
    entity_id: { type: String },
    related_entities: [
      {
        entity_type: { type: String },
        entity_id: { type: String },
        _id: false,
      },
    ],

    // Page targeting
    target_page_types: [{ type: String }],

    // Template support
    template_key: { type: String },
    is_dynamic: { type: Boolean, default: false },
    is_editorial: { type: Boolean, default: true },
    source_type: {
      type: String,
      enum: ['manual', 'template', 'ai', 'import'],
      default: 'manual',
    },

    // SEO / deduplication
    canonical_intent_key: { type: String },
    normalized_question: { type: String },
    indexable: { type: Boolean, default: true },
    schema_enabled: { type: Boolean, default: true },

    // Scoring
    priority_score: { type: Number, default: 50 },
    freshness_score: { type: Number, default: 100 },
    faq_health_score: { type: Number, default: 100 },

    // Status
    visibility_status: {
      type: String,
      enum: ['visible', 'hidden', 'scheduled'],
      default: 'visible',
    },
    needs_refresh: { type: Boolean, default: false },
    last_reviewed_at: { type: Date },

    // Analytics
    click_count: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

faqSchema.index({ category: 1 });
faqSchema.index({ tags: 1 });
faqSchema.index({ faq_group: 1 });
faqSchema.index({ is_published: 1, is_deleted: 1 });
faqSchema.index({ question: 'text', answer: 'text' });
faqSchema.index({ is_featured: 1 });
faqSchema.index({ order: 1 });
faqSchema.index({ view_count: -1 });
faqSchema.index({ is_published: 1, is_deleted: 1, is_featured: 1 });
faqSchema.index({ faq_group: 1, is_published: 1, is_deleted: 1, order: 1 });

// Intelligence indexes
faqSchema.index({ faq_type: 1 });
faqSchema.index({ entity_type: 1, entity_id: 1 });
faqSchema.index({ target_page_types: 1 });
faqSchema.index({ canonical_intent_key: 1 });
faqSchema.index({ priority_score: -1 });
faqSchema.index({ visibility_status: 1, is_published: 1, is_deleted: 1 });
faqSchema.index({ faq_type: 1, entity_type: 1, is_published: 1, is_deleted: 1 });

export const FAQ = model<IFAQ>('FAQ', faqSchema);
