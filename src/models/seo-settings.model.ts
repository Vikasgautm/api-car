import { Document, Schema, model } from 'mongoose';

export interface ISEOSettings extends Document {
  site_title: string;
  site_description: string;
  site_keywords: string;
  og_default_image: string;
  twitter_handle: string;
  google_analytics_id: string;
  google_tag_manager_id: string;
  facebook_pixel_id: string;
}

const seoSettingsSchema = new Schema<ISEOSettings>(
  {
    site_title: { type: String, required: true },
    site_description: { type: String, required: true, maxlength: 160 },
    site_keywords: { type: String },
    og_default_image: { type: String },
    twitter_handle: { type: String },
    google_analytics_id: { type: String },
    google_tag_manager_id: { type: String },
    facebook_pixel_id: { type: String },
  },
  { timestamps: true }
);

export const SEOSettings = model<ISEOSettings>('SEOSettings', seoSettingsSchema);
