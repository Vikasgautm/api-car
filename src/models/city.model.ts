import { Schema, model, Document } from 'mongoose';

export interface ICity extends Document {
  city_uuid: string;
  city_name: string;
  slug: string;
  state: string;
  pincode: number;
  longitude: number;
  latitude: number;
  city_logo?: string;
  is_deleted: boolean;
}

const citySchema = new Schema<ICity>(
  {
    city_uuid: { type: String, required: true, unique: true },
    city_name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    state: { type: String, required: true },
    pincode: { type: Number, required: true },
    longitude: { type: Number, required: true },
    latitude: { type: Number, required: true },
    city_logo: { type: String },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const City = model<ICity>('City', citySchema);
