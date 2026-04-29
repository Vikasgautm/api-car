import { Document, Schema, model } from 'mongoose';

export interface IFuelType extends Document {
  fuel_type_id: string;
  name: string;
  slug: string;
  description?: string;
  is_published: boolean;
  is_deleted: boolean;
  is_featured?: boolean;
  logo?: {
    title?: string;
    url: string;
  };
}

const fuelTypeSchema = new Schema<IFuelType>(
  {
    fuel_type_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

fuelTypeSchema.index({ is_deleted: 1 });
fuelTypeSchema.index({ is_published: 1 });
fuelTypeSchema.index({ is_published: 1, is_deleted: 1 });
fuelTypeSchema.index({ is_featured: 1 });
fuelTypeSchema.index({ name: 1 });
fuelTypeSchema.index({ name: 'text' });

export const FuelType = model<IFuelType>('FuelType', fuelTypeSchema);
