import { Document, Schema, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IImportKeyMapping extends Document {
  mapping_id: string;
  source: 'carwale' | 'cardekho';
  scraped_key: string;
  normalized_scraped_key: string;
  target_model: 'Car' | 'CarVariant';
  target_field: string;
  target_section?: string;
  value_type?: 'string' | 'number' | 'boolean' | 'array';
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ImportKeyMappingSchema = new Schema<IImportKeyMapping>(
  {
    mapping_id: { type: String, default: () => uuidv4(), unique: true },
    source: { type: String, enum: ['carwale', 'cardekho'], required: true },
    scraped_key: { type: String, required: true },
    normalized_scraped_key: { type: String, required: true },
    target_model: { type: String, enum: ['Car', 'CarVariant'], required: true },
    target_field: { type: String, required: true },
    target_section: { type: String },
    value_type: { type: String, enum: ['string', 'number', 'boolean', 'array'], default: 'string' },
    is_active: { type: Boolean, default: true },
    created_by: { type: String },
    updated_by: { type: String },
  },
  { timestamps: true }
);

// Compound index: one active mapping per (source, scraped_key, target_model)
ImportKeyMappingSchema.index(
  { source: 1, normalized_scraped_key: 1, target_model: 1 },
  { unique: true, partialFilterExpression: { is_active: true } }
);
ImportKeyMappingSchema.index({ source: 1, scraped_key: 1 });

export const ImportKeyMapping = model<IImportKeyMapping>('ImportKeyMapping', ImportKeyMappingSchema);
