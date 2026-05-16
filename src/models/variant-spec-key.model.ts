import { Document, Schema, model } from 'mongoose';

export type SpecDataType = 'string' | 'number' | 'boolean' | 'list' | 'date';
export type SpecCategory = 'engine_performance' | 'mileage_range' | 'battery_charging' | 'dimensions_practicality' | 'suspension_steering_brakes' | 'tyres_wheels' | 'safety' | 'adas' | 'comfort_convenience' | 'infotainment_connectivity' | 'connected_car' | 'interior' | 'exterior' | 'warranty';

export interface IVariantSpecKey extends Document {
  key_id: string;
  name: string;
  slug: string;
  category: SpecCategory;
  section: string;
  data_type: SpecDataType;
  unit?: string;
  aliases: string[];
  fuel_type_visibility?: string[];
  is_published: boolean;
  is_deleted: boolean;
  sort_order?: number;
  display_order?: number;
}

const variantSpecKeySchema = new Schema<IVariantSpecKey>(
  {
    key_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    category: { 
      type: String, 
      enum: ['engine_performance', 'mileage_range', 'battery_charging', 'dimensions_practicality', 'suspension_steering_brakes', 'tyres_wheels', 'safety', 'adas', 'comfort_convenience', 'infotainment_connectivity', 'connected_car', 'interior', 'exterior', 'warranty'],
      required: true 
    },
    section: { type: String, required: true },
    data_type: { 
      type: String, 
      enum: ['string', 'number', 'boolean', 'list', 'date'],
      required: true 
    },
    unit: { type: String },
    aliases: { type: [String], default: [] },
    fuel_type_visibility: { type: [String], default: [] },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    sort_order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

variantSpecKeySchema.index({ is_deleted: 1 });
variantSpecKeySchema.index({ is_published: 1 });
variantSpecKeySchema.index({ category: 1 });
variantSpecKeySchema.index({ slug: 1 });
variantSpecKeySchema.index({ name: 'text' });

export const VariantSpecKey = model<IVariantSpecKey>('VariantSpecKey', variantSpecKeySchema);
