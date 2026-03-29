import { Schema, model, Document } from 'mongoose';

export interface IBrand extends Document {
  brand_uuid: string;
  brand_name: string;
  brand_slug: string;
  images: {
    // preview: string;
    title: string;
    url: string;
  };
  is_published: boolean;
  is_deleted: boolean;
}

const brandSchema = new Schema<IBrand>(
  {
    brand_uuid: { type: String, required: true, unique: true },
    brand_name: { type: String, required: true },
    brand_slug: { type: String, required: true, unique: true },
    images: {
      type: {
        // preview: { type: String },
        title: { type: String },
        url: { type: String },
      },
      required: true,
    },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Brand = model<IBrand>('Brand', brandSchema);
