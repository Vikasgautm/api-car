import { Document, Schema, model } from 'mongoose';
import { FuelCategory } from '../constants/mileage-benchmarks';

export interface IMileageBenchmarkOverride extends Document {
  override_id: string;
  body_type_id: string;
  fuel_category: FuelCategory;
  thresholds: {
    weak_max: number;
    average_max: number;
    good_max: number;
  };
  updated_by?: string;
}

const overrideSchema = new Schema<IMileageBenchmarkOverride>(
  {
    override_id: { type: String, required: true, unique: true },
    body_type_id: { type: String, required: true },
    fuel_category: { type: String, enum: ['ice', 'ev'], required: true },
    thresholds: {
      weak_max: { type: Number, required: true, min: 0 },
      average_max: { type: Number, required: true, min: 0 },
      good_max: { type: Number, required: true, min: 0 },
    },
    updated_by: { type: String },
  },
  { timestamps: true }
);

overrideSchema.index({ body_type_id: 1, fuel_category: 1 }, { unique: true });

export const MileageBenchmarkOverride = model<IMileageBenchmarkOverride>(
  'MileageBenchmarkOverride',
  overrideSchema
);
