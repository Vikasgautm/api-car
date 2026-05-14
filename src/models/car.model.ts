import { Document, Schema, model } from "mongoose";
import { MileageClass } from "../constants/mileage-benchmarks";

export type CarStatus = 'upcoming' | 'launched' | 'discontinued' | 'archived' | 'disabled';

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
  // Soft-archive/disable lifecycle (driven by the deletion-approval workflow)
  archived_at?: Date | null;
  archived_by?: string | null;
  disabled_at?: Date | null;
  disabled_by?: string | null;
  discontinued_at?: Date | null;
  discontinued_by?: string | null;
  // SEO redirect: when set, public lookups 301 to this slug.
  redirect_to_slug?: string | null;
  is_featured: boolean;
  is_popular: boolean;
  is_recommended: boolean;
  is_latest: boolean;
  top_selling: boolean;
  tag_ids: string[];
  // Aggregated mileage / EV-range intelligence (computed from variants)
  best_mileage_class?: MileageClass | null;
  best_mileage_value?: number | null;
  best_range_class?: MileageClass | null;
  best_range_value?: number | null;
  // Content ownership
  editor_user_id?: string | null;
  seo_owner_user_id?: string | null;
  reviewer_user_id?: string | null;
  last_reviewed_at?: Date | null;
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
      enum: ['upcoming', 'launched', 'discontinued', 'archived', 'disabled'],
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
    archived_at: { type: Date, default: null },
    archived_by: { type: String, default: null },
    disabled_at: { type: Date, default: null },
    disabled_by: { type: String, default: null },
    discontinued_at: { type: Date, default: null },
    discontinued_by: { type: String, default: null },
    redirect_to_slug: { type: String, default: null },
    is_featured: { type: Boolean, default: false },
    is_popular: { type: Boolean, default: false },
    is_recommended: { type: Boolean, default: false },
    is_latest: { type: Boolean, default: false },
    top_selling: { type: Boolean, default: false },
    tag_ids: { type: [String], default: [] },
    best_mileage_class: { type: String, enum: ['weak', 'average', 'good', 'excellent', null], default: null },
    best_mileage_value: { type: Number, default: null },
    best_range_class: { type: String, enum: ['weak', 'average', 'good', 'excellent', null], default: null },
    best_range_value: { type: Number, default: null },
    editor_user_id: { type: String, default: null },
    seo_owner_user_id: { type: String, default: null },
    reviewer_user_id: { type: String, default: null },
    last_reviewed_at: { type: Date, default: null },
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
carSchema.index({ tag_ids: 1 });
carSchema.index({ tag_ids: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ best_mileage_class: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ best_range_class: 1, is_published: 1, is_deleted: 1 });
carSchema.index({ best_mileage_value: -1 });
carSchema.index({ best_range_value: -1 });
carSchema.index({ editor_user_id: 1 });
carSchema.index({ seo_owner_user_id: 1 });
carSchema.index({ reviewer_user_id: 1 });
carSchema.index({ last_reviewed_at: -1 });
carSchema.index({ status: 1, is_deleted: 1, is_published: 1 });
carSchema.index({ archived_at: -1 });
carSchema.index({ disabled_at: -1 });
carSchema.index({ discontinued_at: -1 });

export const Car = model<ICar>("Car", carSchema);
