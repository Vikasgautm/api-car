import { Document, Schema, model } from 'mongoose';

interface IMediaItem {
  url: string;
  alt?: string;
  public_id?: string;
}

export interface IBrandAggregatesCache {
  total_cars: number;
  total_variants: number;
  body_type_distribution: Array<{
    type_id: string;
    type_name: string;
    slug: string;
    count: number;
    preview_cars: string[];
  }>;
  fuel_type_distribution: Array<{
    fuel_id: string;
    fuel_name: string;
    slug: string;
    count: number;
    preview_cars: string[];
  }>;
  price_range: {
    min: number;
    max: number;
    min_car_name: string;
    max_car_name: string;
    min_car_id?: string;
    max_car_id?: string;
  } | null;
  feature_counts: {
    adas: number;
    sunroof: number;
  };
  has_ev: boolean;
  has_cng: boolean;
  last_computed_at: Date;
}

export interface IBrand extends Document {
  brand_id: string;
  name: string;
  alias?: string;
  slug: string;
  slug_history: Array<{ slug: string; changed_at: Date }>;
  short_description?: string;
  description?: string;
  founded_year?: number;
  country?: string;
  parent_company?: string;
  logo?: {
    title?: string;
    url: string;
  };
  brand_media?: {
    primary_logo?: IMediaItem;
    svg_logo?: IMediaItem;
    hero_banner?: IMediaItem;
    thumbnail?: IMediaItem;
    mobile_banner?: IMediaItem;
  };
  website?: string;
  is_published: boolean;
  is_deleted: boolean;
  is_featured?: boolean;
  is_upcoming?: boolean;
  is_discontinued?: boolean;
  aggregates_cache?: IBrandAggregatesCache;
  // SEO fields
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image?: string;
  canonical_url?: string;
  noindex?: boolean;
}

const mediaItemSchema = new Schema<IMediaItem>(
  {
    url: { type: String, required: true },
    alt: { type: String },
    public_id: { type: String },
  },
  { _id: false }
);

const aggregatesCacheSchema = new Schema(
  {
    total_cars: { type: Number, default: 0 },
    total_variants: { type: Number, default: 0 },
    body_type_distribution: [
      {
        type_id: String,
        type_name: String,
        slug: String,
        count: Number,
        preview_cars: [String],
        _id: false,
      },
    ],
    fuel_type_distribution: [
      {
        fuel_id: String,
        fuel_name: String,
        slug: String,
        count: Number,
        preview_cars: [String],
        _id: false,
      },
    ],
    price_range: {
      type: new Schema(
        {
          min: Number,
          max: Number,
          min_car_name: String,
          max_car_name: String,
          min_car_id: String,
          max_car_id: String,
        },
        { _id: false }
      ),
      default: null,
    },
    feature_counts: {
      type: new Schema(
        {
          adas: { type: Number, default: 0 },
          sunroof: { type: Number, default: 0 },
        },
        { _id: false }
      ),
      default: () => ({ adas: 0, sunroof: 0 }),
    },
    has_ev: { type: Boolean, default: false },
    has_cng: { type: Boolean, default: false },
    last_computed_at: { type: Date },
  },
  { _id: false }
);

const brandSchema = new Schema<IBrand>(
  {
    brand_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    alias: { type: String },
    slug: { type: String, required: true },
    slug_history: [
      {
        slug: { type: String },
        changed_at: { type: Date },
        _id: false,
      },
    ],
    short_description: { type: String, maxlength: 500 },
    description: { type: String },
    founded_year: { type: Number, min: 1800, max: 2100 },
    country: { type: String },
    parent_company: { type: String },
    logo: {
      title: { type: String },
      url: { type: String },
    },
    brand_media: {
      primary_logo: { type: mediaItemSchema },
      svg_logo: { type: mediaItemSchema },
      hero_banner: { type: mediaItemSchema },
      thumbnail: { type: mediaItemSchema },
      mobile_banner: { type: mediaItemSchema },
    },
    website: { type: String },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    is_upcoming: { type: Boolean, default: false },
    is_discontinued: { type: Boolean, default: false },
    aggregates_cache: { type: aggregatesCacheSchema },
    // SEO fields
    meta_title: { type: String },
    meta_description: { type: String, maxlength: 160 },
    meta_keywords: { type: String },
    og_image: { type: String },
    canonical_url: { type: String },
    noindex: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

brandSchema.index({ is_deleted: 1 });
brandSchema.index({ is_published: 1 });
brandSchema.index({ is_published: 1, is_deleted: 1 });
brandSchema.index({ is_featured: 1 });
brandSchema.index({ is_upcoming: 1, is_deleted: 1 });
brandSchema.index({ is_discontinued: 1, is_deleted: 1 });
brandSchema.index({ 'aggregates_cache.has_ev': 1, is_deleted: 1 });
brandSchema.index({ 'aggregates_cache.total_variants': -1, is_deleted: 1 });
brandSchema.index({ name: 'text' });

// Slug must be unique only among non-deleted brands so admins can reuse the slug
// of a soft-deleted brand. In production, drop the old index first:
// db.brands.dropIndex("slug_1")
brandSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { is_deleted: false }, name: 'uniq_slug_active' }
);

export const Brand = model<IBrand>('Brand', brandSchema);
