import { Document, Schema, model } from 'mongoose';

export interface ICity extends Document {
  city_id: string;
  name: string;
  slug: string;
  state: string;
  country?: string;
  pincode?: number;
  longitude?: number;
  latitude?: number;
}

const citySchema = new Schema<ICity>(
  {
    city_id: { type: String, required: true, unique: true },
    name: { type: String, required: true, minlength: 2, maxlength: 100 },
    slug: { type: String, required: true, unique: true },
    state: { type: String, required: true, minlength: 2, maxlength: 100 },
    country: { type: String, default: 'India' },
    pincode: { type: Number },
    longitude: { type: Number, min: -180, max: 180 },
    latitude: { type: Number, min: -90, max: 90 },
  },
  {
    timestamps: true,
  }
);

citySchema.index({ name: 1 });
citySchema.index({ state: 1 });
citySchema.index({ name: 'text', state: 'text' });

export const City = model<ICity>('City', citySchema);
