import { Document, Schema, model } from 'mongoose';

export type ArticleType = 'review' | 'comparison' | 'news' | 'guide' | 'listicle' | 'opinion' | 'launch' | 'first_drive';
export type ArticleStatus = 'draft' | 'review' | 'published' | 'archived' | 'stale';
export type ArticleIntent = 'informational' | 'commercial' | 'transactional' | 'navigational';

export interface IBlog extends Document {
  blog_id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author_name?: string;
  author_id?: string;
  category: string;
  tags?: string[];
  thumbnail?: {
    url: string;
    alt?: string;
  };
  images?: Array<{
    url: string;
    alt?: string;
  }>;
  link?: string;
  is_published: boolean;
  is_deleted: boolean;
  is_featured?: boolean;
  // SEO fields
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image?: string;
  canonical_url?: string;
  noindex?: boolean;
  // Content classification
  article_type?: ArticleType;
  article_status?: ArticleStatus;
  article_intent?: ArticleIntent;
  target_keyword?: string;
  freshness_score?: number;
  seo_health_score?: number;
  stale_flags?: string[];
  last_verified_at?: Date;
  internal_link_count?: number;
  related_articles_count?: number;
  // Ecosystem relationships
  connected_cars?: string[];
  connected_variants?: string[];
  connected_brands?: string[];
  connected_body_types?: string[];
  connected_fuel_types?: string[];
  connected_comparisons?: string[];
  connected_collections?: string[];
}

const blogSchema = new Schema<IBlog>(
  {
    blog_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true, maxlength: 500 },
    content: { type: String, required: true },
    author_name: { type: String },
    author_id: { type: String },
    category: { type: String, required: true },
    tags: [{ type: String }],
    thumbnail: {
      url: { type: String },
      alt: { type: String },
    },
    images: [{
      url: { type: String },
      alt: { type: String },
    }],
    link: { type: String },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    // SEO fields
    meta_title: { type: String },
    meta_description: { type: String, maxlength: 160 },
    meta_keywords: { type: String },
    og_image: { type: String },
    canonical_url: { type: String },
    noindex: { type: Boolean, default: false },
    // Content classification
    article_type: { type: String, enum: ['review', 'comparison', 'news', 'guide', 'listicle', 'opinion', 'launch', 'first_drive'] },
    article_status: { type: String, enum: ['draft', 'review', 'published', 'archived', 'stale'], default: 'draft' },
    article_intent: { type: String, enum: ['informational', 'commercial', 'transactional', 'navigational'] },
    target_keyword: { type: String },
    freshness_score: { type: Number, min: 0, max: 100, default: 100 },
    seo_health_score: { type: Number, min: 0, max: 100 },
    stale_flags: [{ type: String }],
    last_verified_at: { type: Date },
    internal_link_count: { type: Number, default: 0 },
    related_articles_count: { type: Number, default: 0 },
    // Ecosystem relationships (store entity IDs)
    connected_cars: [{ type: String }],
    connected_variants: [{ type: String }],
    connected_brands: [{ type: String }],
    connected_body_types: [{ type: String }],
    connected_fuel_types: [{ type: String }],
    connected_comparisons: [{ type: String }],
    connected_collections: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

blogSchema.index({ author_id: 1 });
blogSchema.index({ author_name: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ is_published: 1, is_deleted: 1 });
blogSchema.index({ is_featured: 1 });
blogSchema.index({ title: 'text', content: 'text', excerpt: 'text' });
// Automotive intelligence indexes
blogSchema.index({ connected_cars: 1 });
blogSchema.index({ connected_brands: 1 });
blogSchema.index({ connected_fuel_types: 1 });
blogSchema.index({ connected_body_types: 1 });
blogSchema.index({ connected_comparisons: 1 });
blogSchema.index({ connected_collections: 1 });
blogSchema.index({ article_type: 1 });
blogSchema.index({ article_status: 1 });
blogSchema.index({ freshness_score: -1 });
blogSchema.index({ target_keyword: 1 });

export const Blog = model<IBlog>('Blog', blogSchema);
