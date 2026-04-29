import { Document, model, Schema } from 'mongoose';

export type ImportType = 'car' | 'variant';
export type ImportStatus = 'previewed' | 'saved' | 'failed';
export type ImportSource = 'cardekho';

export interface IImportLog extends Omit<Document, 'errors'> {
  import_id: string;
  source: ImportSource;
  import_type: ImportType;
  source_url: string;
  car_id?: string;
  variant_id?: string;
  status: ImportStatus;
  extracted_data: Record<string, any>;
  matched_data: Record<string, any>;
  unmatched_data: Record<string, any>;
  warnings: string[];
  error_messages: string[];
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

const importLogSchema = new Schema<IImportLog>(
  {
    import_id: { type: String, required: true, unique: true },
    source: { type: String, enum: ['cardekho'], required: true },
    import_type: { type: String, enum: ['car', 'variant'], required: true },
    source_url: { type: String, required: true },
    car_id: { type: String },
    variant_id: { type: String },
    status: { 
      type: String, 
      enum: ['previewed', 'saved', 'failed'], 
      default: 'previewed'
    },
    extracted_data: { type: Schema.Types.Mixed, default: {} },
    matched_data: { type: Schema.Types.Mixed, default: {} },
    unmatched_data: { type: Schema.Types.Mixed, default: {} },
    warnings: { type: [String], default: [] },
    error_messages: { type: [String], default: [] },
    created_by: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

importLogSchema.index({ source_url: 1 });
importLogSchema.index({ car_id: 1 });
importLogSchema.index({ variant_id: 1 });
importLogSchema.index({ status: 1 });
importLogSchema.index({ created_by: 1 });
importLogSchema.index({ created_at: -1 });

export const ImportLog = model<IImportLog>('ImportLog', importLogSchema);
