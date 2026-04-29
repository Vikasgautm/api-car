import { Document, Schema, model } from "mongoose";

export type CarStatus = 'upcoming' | 'launched' | 'discontinued';

export interface ICar extends Document {
  car_id: string;
  name: string;
  slug: string;
  brand_id: string;
  body_type_id: string;
  fuel_type_id?: string;
  short_description?: string;
  description: string;
  thumbnail?: {
    url: string;
    alt?: string;
  };
  images?: Array<{
    url: string;
    alt?: string;
  }>;
  gallery_summary?: string;
  status: CarStatus;
  is_upcoming: boolean;
  is_launched: boolean;
  expected_exshowroom_price?: number | null;
  expected_launch_date?: Date | null;
  exshowroom_price?: number | null;
  launch_date?: Date | null;
  is_electric: boolean;
  is_published: boolean;
  is_deleted: boolean;
  is_featured: boolean;
  is_popular: boolean;
  is_recommended: boolean;
  is_latest: boolean;
  top_selling: boolean;
  // SEO fields
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image?: string;
  canonical_url?: string;
  noindex?: boolean;
}

const carSchema = new Schema<ICar>(
  {
    car_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    brand_id: { type: String, required: true },
    body_type_id: { type: String, required: true },
    fuel_type_id: { type: String },
    short_description: { type: String },
    description: { type: String, required: true },
    thumbnail: {
      url: { type: String },
      alt: { type: String },
    },
    images: [{
      url: { type: String },
      alt: { type: String },
    }],
    gallery_summary: { type: String },
    status: { 
      type: String, 
      enum: ['upcoming', 'launched', 'discontinued'], 
      default: 'launched'
    },
    is_upcoming: { type: Boolean, default: false },
    is_launched: { type: Boolean, default: true },
    expected_exshowroom_price: { type: Number, default: null },
    expected_launch_date: { type: Date, default: null },
    exshowroom_price: { type: Number, default: null },
    launch_date: { type: Date, default: null },
    is_electric: { type: Boolean, default: false },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    is_popular: { type: Boolean, default: false },
    is_recommended: { type: Boolean, default: false },
    is_latest: { type: Boolean, default: false },
    top_selling: { type: Boolean, default: false },
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

carSchema.index({ brand_id: 1 });
carSchema.index({ body_type_id: 1 });
carSchema.index({ fuel_type_id: 1 });
carSchema.index({ status: 1 });
carSchema.index({ is_published: 1, is_deleted: 1 });
carSchema.index({ is_deleted: 1 });
carSchema.index({ is_published: 1 });
carSchema.index({ is_electric: 1 });
carSchema.index({ is_featured: 1 });
carSchema.index({ is_popular: 1 });
carSchema.index({ is_recommended: 1 });
carSchema.index({ is_latest: 1 });
carSchema.index({ top_selling: 1 });
carSchema.index({ is_upcoming: 1 });
carSchema.index({ is_launched: 1 });
carSchema.index({ expected_launch_date: 1 });
carSchema.index({ launch_date: 1 });
carSchema.index({ name: 'text' });
carSchema.index({ brand_id: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ body_type_id: 1, is_published: 1, is_deleted: 1 });

export const Car = model<ICar>("Car", carSchema);
