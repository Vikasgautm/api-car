import { Document, Schema, model } from "mongoose";

export interface ICar extends Document {
  car_id: string;
  car_name: string;
  description: string;
  slug: string;
  // brand_id: string;
  brand_id: Schema.Types.ObjectId;
  body_type_id: string;
  thumbnail: {
    preview: string;
    title: string;
  };
  images: Array<{
    preview: string;
    title: string;
  }>;
  link: string;
  upcoming: boolean;
  recommended: boolean;
  popular: boolean;
  latest: boolean;
  electric: boolean;
  is_published: boolean;
  is_deleted: boolean;
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
    car_name: { type: String, required: true },
    description: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    brand_id: { type: Schema.Types.ObjectId, ref: "Brand", required: true },

    // brand_id: { type: String, ref: "Brand", required: true },
    body_type_id: { type: String, ref: "BodyType", required: true },
    // body_type_id: { type: Schema.Types.ObjectId, ref: 'BodyType', required: true },

    thumbnail: {
      type: {
        preview: { type: String },
        title: { type: String },
      },
      required: true,
    },
    images: {
      type: [
        {
          preview: { type: String },
          title: { type: String },
        },
      ],
      required: true,
    },
    link: { type: String, required: true },
    upcoming: { type: Boolean, default: false },
    recommended: { type: Boolean, default: false },
    popular: { type: Boolean, default: false },
    latest: { type: Boolean, default: true },
    electric: { type: Boolean, default: false },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    // SEO fields
    meta_title: { type: String },
    meta_description: { type: String, maxlength: 160 },
    meta_keywords: { type: String },
    og_image: { type: String },
    canonical_url: { type: String },
    noindex: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Car = model<ICar>("Car", carSchema);
