import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IComparisonRival extends Document {
  rival_id: string;
  primary_car_id: string;
  rival_car_id: string;
  relationship_strength: number;
  primary_segment?: string;
  rival_segment?: string;
  price_proximity?: number;
  manual_mapping: boolean;
  created_at: Date;
  updated_at: Date;
}

const ComparisonRivalSchema: Schema<IComparisonRival> = new Schema(
  {
    rival_id: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      index: true,
    },
    primary_car_id: {
      type: String,
      required: true,
      index: true,
    },
    rival_car_id: {
      type: String,
      required: true,
      index: true,
    },
    relationship_strength: {
      type: Number,
      default: 1,
      min: 0,
      max: 100,
    },
    primary_segment: String,
    rival_segment: String,
    price_proximity: Number,
    manual_mapping: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

// Compound index to prevent duplicate rivalries in same direction
ComparisonRivalSchema.index({ primary_car_id: 1, rival_car_id: 1 }, { unique: true });
ComparisonRivalSchema.index({ rival_car_id: 1, primary_car_id: 1 });
ComparisonRivalSchema.index({ relationship_strength: -1 });

export const ComparisonRival = mongoose.model<IComparisonRival>('ComparisonRival', ComparisonRivalSchema);
