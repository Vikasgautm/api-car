import { Document, Schema, model } from 'mongoose';

export interface IBrand extends Document {
  brand_id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: {
    title?: string;
    url: string;
  };
  website?: string;
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
}

const brandSchema = new Schema<IBrand>(
  {
    brand_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    logo: {
      title: { type: String },
      url: { type: String },
    },
    website: { type: String },
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
  },
  {
    timestamps: true,
  }
);

brandSchema.index({ is_deleted: 1 });
brandSchema.index({ is_published: 1 });
brandSchema.index({ is_published: 1, is_deleted: 1 });
brandSchema.index({ is_featured: 1 });
brandSchema.index({ name: 'text' });

export const Brand = model<IBrand>('Brand', brandSchema);
