import { Schema, model, Document } from 'mongoose';

export interface IFuelType extends Document {
  fuel_type_id: string;
  name: string;
  slug: string;
  description?: string;
  is_deleted: boolean;
}

const fuelTypeSchema = new Schema<IFuelType>(
  {
    fuel_type_id: { type: String, unique: true, required: true },
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const FuelType = model<IFuelType>('FuelType', fuelTypeSchema);
