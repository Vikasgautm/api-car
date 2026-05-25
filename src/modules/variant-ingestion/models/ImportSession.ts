import { Document, Schema, model } from 'mongoose';

export type SessionStatus = 'active' | 'completed' | 'partial' | 'failed';

export interface IImportSession extends Document {
  session_name: string;
  source_name: string;
  total_variants: number;
  linked_variants: number;
  validated_variants: number;
  pushed_variants: number;
  failed_variants: number;
  session_status: SessionStatus;
  imported_by: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const ImportSessionSchema = new Schema<IImportSession>(
  {
    session_name: { type: String, required: true, trim: true },
    source_name: { type: String, default: 'manual' },
    total_variants: { type: Number, default: 0 },
    linked_variants: { type: Number, default: 0 },
    validated_variants: { type: Number, default: 0 },
    pushed_variants: { type: Number, default: 0 },
    failed_variants: { type: Number, default: 0 },
    session_status: {
      type: String,
      enum: ['active', 'completed', 'partial', 'failed'],
      default: 'active',
    },
    imported_by: { type: String, default: 'admin' },
    notes: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export const ImportSession = model<IImportSession>('ImportSession', ImportSessionSchema);
