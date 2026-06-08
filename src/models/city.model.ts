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
  is_published?: boolean;
  is_featured?: boolean;
  noindex?: boolean;
  is_deleted?: boolean;
  deleted_at?: Date;
}

const citySchema = new Schema<ICity>(
  {
    city_id: { type: String, required: true, unique: true },
    name: { type: String, required: true, minlength: 2, maxlength: 100 },
    slug: { type: String, required: true, unique: true },
    state: { type: String, required: true, minlength: 2, maxlength: 100 },
    country: { type: String, default: 'India' },
    pincode: { type: String },
    longitude: { type: Number, min: -180, max: 180 },
    latitude: { type: Number, min: -90, max: 90 },
    is_published: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    noindex: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date },
  },
  {
    timestamps: true,
  }
);

citySchema.index({ name: 1 });
citySchema.index({ state: 1 });
citySchema.index({ is_published: 1 });
citySchema.index({ is_featured: 1 });
citySchema.index({ name: 'text', state: 'text' });

export const City = model<ICity>('City', citySchema);
