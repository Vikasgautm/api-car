import { Document, Schema, model } from 'mongoose';

export type CollectionType =
  | 'trending'
  | 'popular'
  | 'ev'
  | 'mileage'
  | 'comparison'
  | 'family'
  | 'launch'
  | 'brand'
  | 'custom';

export type CollectionStatus = 'draft' | 'published' | 'archived';

export type CollectionRenderingMode = 'manual' | 'hybrid' | 'behavioral' | 'observe_only';

export type CollectionScoreType =
  | 'popularity'
  | 'trending'
  | 'engagement'
  | 'buyer_intent'
  | 'comparison_pressure'
  | 'retention'
  | 'manual';

export interface IDiscoveryFilters {
  body_type_slugs?: string[];
  fuel_type_slugs?: string[];
  brand_slugs?: string[];
  lifecycle_stages?: string[];
  min_price?: number;
  max_price?: number;
  transmission?: string[];
  seating_min?: number;
  seating_max?: number;
  tags?: string[];
  has_adas?: boolean;
  has_sunroof?: boolean;
  mileage_class?: string[];
  is_electric?: boolean;
  vehicle_segment?: string[];
  family_friendly?: boolean;
}

export interface IPopularCollection extends Document {
  collection_id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  collection_type: CollectionType;
  status: CollectionStatus;

  discovery_filters: IDiscoveryFilters;
  default_sort: string;

  ranking_collection_key?: string;
  primary_score_type: CollectionScoreType;

  rendering_mode: CollectionRenderingMode;
  manual_weight: number;
  behavioral_weight: number;
  min_behavioral_confidence: number;

  pinned_car_ids: string[];
  manual_car_ids: string[];
  suppressed_car_ids: string[];

  hub_preview_limit: number;
  collection_page_limit: number;
  display_on_hub: boolean;
  hub_section_order: number;
  hub_section_label?: string;
  view_all_path: string;

  seo_h1?: string;
  seo_meta_title?: string;
  seo_meta_description?: string;
  seo_intro_content?: string;
  seo_conclusion_content?: string;
  seo_noindex: boolean;
  seo_canonical_url?: string;

  related_collection_slugs: string[];

  created_by?: string;
  updated_by?: string;
  last_rendered_at?: Date;
}

const discoveryFiltersSchema = new Schema<IDiscoveryFilters>(
  {
    body_type_slugs: [String],
    fuel_type_slugs: [String],
    brand_slugs: [String],
    lifecycle_stages: [String],
    min_price: Number,
    max_price: Number,
    transmission: [String],
    seating_min: Number,
    seating_max: Number,
    tags: [String],
    has_adas: Boolean,
    has_sunroof: Boolean,
    mileage_class: [String],
    is_electric: Boolean,
    vehicle_segment: [String],
    family_friendly: Boolean,
  },
  { _id: false }
);

const schema = new Schema<IPopularCollection>(
  {
    collection_id: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: null },
    description: { type: String, default: null },
    collection_type: {
      type: String,
      enum: ['trending', 'popular', 'ev', 'mileage', 'comparison', 'family', 'launch', 'brand', 'custom'],
      default: 'popular',
    },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },

    discovery_filters: { type: discoveryFiltersSchema, default: {} },
    default_sort: { type: String, default: 'popularity' },

    ranking_collection_key: { type: String, default: null },
    primary_score_type: {
      type: String,
      enum: ['popularity', 'trending', 'engagement', 'buyer_intent', 'comparison_pressure', 'retention', 'manual'],
      default: 'popularity',
    },

    rendering_mode: {
      type: String,
      enum: ['manual', 'hybrid', 'behavioral', 'observe_only'],
      default: 'manual',
    },
    manual_weight: { type: Number, default: 70, min: 0, max: 100 },
    behavioral_weight: { type: Number, default: 30, min: 0, max: 100 },
    min_behavioral_confidence: { type: Number, default: 70, min: 0, max: 100 },

    pinned_car_ids: [{ type: String }],
    manual_car_ids: [{ type: String }],
    suppressed_car_ids: [{ type: String }],

    hub_preview_limit: { type: Number, default: 5 },
    collection_page_limit: { type: Number, default: 24 },
    display_on_hub: { type: Boolean, default: true },
    hub_section_order: { type: Number, default: 0 },
    hub_section_label: { type: String, default: null },
    view_all_path: { type: String, required: true },

    seo_h1: { type: String, default: null },
    seo_meta_title: { type: String, default: null },
    seo_meta_description: { type: String, default: null },
    seo_intro_content: { type: String, default: null },
    seo_conclusion_content: { type: String, default: null },
    seo_noindex: { type: Boolean, default: false },
    seo_canonical_url: { type: String, default: null },

    related_collection_slugs: [{ type: String }],

    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
    last_rendered_at: { type: Date, default: null },
  },
  { timestamps: true }
);

schema.index({ status: 1 });
schema.index({ collection_type: 1 });
schema.index({ display_on_hub: 1, hub_section_order: 1 });

export const PopularCollection = model<IPopularCollection>('PopularCollection', schema);
