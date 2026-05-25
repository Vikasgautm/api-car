import { Document, Schema, Types, model } from 'mongoose';

export type ImportStatus =
  | 'imported'
  | 'grouped'
  | 'linked'
  | 'validation_failed'
  | 'reviewed'
  | 'ready_to_push'
  | 'pushed'
  | 'rejected'
  | 'draft';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface IVariantImportStaging extends Document {
  source_car_name: string;
  normalized_car_name: string;
  variant_name: string;
  price?: number;
  fuel_type?: string;
  transmission?: string;
  raw_specs: Record<string, any>;
  normalized_specs: Record<string, any>;
  suggested_car_id?: string;
  suggested_car_name?: string;
  linked_car_id?: string;
  linked_car_name?: string;
  confidence_score: number;
  completeness_score: number;
  validation_results: ValidationIssue[];
  import_status: ImportStatus;
  import_session_id?: Types.ObjectId;
  imported_by: string;
  reviewed_by?: string;
  linked_by?: string;
  pushed_by?: string;
  pushed_variant_id?: string;
  rejection_reason?: string;
  created_at: Date;
  updated_at: Date;
}

const ValidationIssueSchema = new Schema(
  {
    field: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, enum: ['error', 'warning'], default: 'error' },
  },
  { _id: false }
);

const VariantImportStagingSchema = new Schema<IVariantImportStaging>(
  {
    source_car_name: { type: String, required: true, trim: true },
    normalized_car_name: { type: String, default: '' },
    variant_name: { type: String, required: true, trim: true },
    price: { type: Number },
    fuel_type: { type: String },
    transmission: { type: String },
    raw_specs: { type: Schema.Types.Mixed, default: {} },
    normalized_specs: { type: Schema.Types.Mixed, default: {} },
    suggested_car_id: { type: String },
    suggested_car_name: { type: String },
    linked_car_id: { type: String },
    linked_car_name: { type: String },
    confidence_score: { type: Number, min: 0, max: 1, default: 0 },
    completeness_score: { type: Number, min: 0, max: 100, default: 0 },
    validation_results: { type: [ValidationIssueSchema], default: [] },
    import_status: {
      type: String,
      enum: ['imported', 'grouped', 'linked', 'validation_failed', 'reviewed', 'ready_to_push', 'pushed', 'rejected', 'draft'],
      default: 'imported',
    },
    import_session_id: { type: Schema.Types.ObjectId, ref: 'ImportSession' },
    imported_by: { type: String, default: 'admin' },
    reviewed_by: { type: String },
    linked_by: { type: String },
    pushed_by: { type: String },
    pushed_variant_id: { type: String },
    rejection_reason: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

VariantImportStagingSchema.index({ import_session_id: 1 });
VariantImportStagingSchema.index({ import_status: 1 });
VariantImportStagingSchema.index({ linked_car_id: 1 });
VariantImportStagingSchema.index({ source_car_name: 1 });
VariantImportStagingSchema.index({ normalized_car_name: 1 });

export const VariantImportStaging = model<IVariantImportStaging>('VariantImportStaging', VariantImportStagingSchema);
