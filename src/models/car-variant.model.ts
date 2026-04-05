import { Schema, model, Document } from 'mongoose';

export interface ICarVariant extends Document {
  variant_id: string;
  variant_name: string;
  description: string;
  slug: string;
  car_id: string;
  exshowroom_price: string;
  expectedExShowroomPrice?: string;
  expectedLaunchDate?: string;
  specification?: any;
  is_published: boolean;
  is_deleted: boolean;
}

const variantSchema = new Schema<ICarVariant>(
  {
    variant_id: { type: String, required: true, unique: true },
    variant_name: { type: String, required: true },
    description: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    car_id: { type: String, required: true, ref: 'Car' },
    exshowroom_price: { type: String, required: true },
    expectedExShowroomPrice: { type: String },
    expectedLaunchDate: { type: String },
    specification: { type: Schema.Types.Mixed },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const CarVariant = model<ICarVariant>('CarVariant', variantSchema);
