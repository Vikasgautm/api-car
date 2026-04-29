import { Document, Schema, model } from 'mongoose';

export interface ICity extends Document {
  city_id: string;
  name: string;
  slug: string;
  state: string;
  country?: string;
  pincode?: string;
  longitude?: number;
  latitude?: number;
  city_logo?: string;
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

const citySchema = new Schema<ICity>(
  {
    city_id: { type: String, required: true, unique: true },
    name: { type: String, required: true, minlength: 2, maxlength: 100 },
    slug: { type: String, required: true, unique: true },
    state: { type: String, required: true, minlength: 2, maxlength: 100 },
    country: { type: String, default: 'India' },
    pincode: { type: String, match: /^[0-9]{6}$/ },
    longitude: { type: Number, min: -180, max: 180 },
    latitude: { type: Number, min: -90, max: 90 },
    city_logo: { type: String },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    // SEO fields
    meta_title: { type: String, maxlength: 60 },
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

citySchema.index({ name: 1 });
citySchema.index({ state: 1 });
citySchema.index({ is_deleted: 1 });
citySchema.index({ is_published: 1, is_deleted: 1 });
citySchema.index({ is_published: 1 });
citySchema.index({ is_featured: 1 });
citySchema.index({ name: 'text', state: 'text' });

export const City = model<ICity>('City', citySchema);
