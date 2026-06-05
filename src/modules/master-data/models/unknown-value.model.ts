import { Document, Schema, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IUnknownValue extends Document {
  unknown_id: string;
  category_key: string;
  raw_value: string;
  context?: string;         // e.g. variant_id, import_session_id
  occurrence_count: number;
  is_resolved: boolean;
  resolved_to?: string;     // value of the master option it was mapped to
  resolved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const unknownValueSchema = new Schema<IUnknownValue>(
  {
    unknown_id: { type: String, required: true, unique: true, default: () => uuidv4() },
    category_key: { type: String, required: true, index: true },
    raw_value: { type: String, required: true, trim: true },
    context: { type: String, default: '' },
    occurrence_count: { type: Number, default: 1 },
    is_resolved: { type: Boolean, default: false, index: true },
    resolved_to: { type: String, default: null },
    resolved_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

unknownValueSchema.index({ category_key: 1, raw_value: 1 }, { unique: true });
unknownValueSchema.index({ is_resolved: 1, created_at: -1 });

export const UnknownValue = model<IUnknownValue>('UnknownValue', unknownValueSchema);
