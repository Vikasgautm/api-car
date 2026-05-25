import { Document, Schema, model } from 'mongoose';

export type SettingsGroup =
  | 'general'
  | 'seo'
  | 'imports'
  | 'ai_intelligence'
  | 'lifecycle_publishing'
  | 'media'
  | 'performance'
  | 'security'
  | 'feature_flags'
  | 'audit_logs';

export const SETTINGS_GROUPS: SettingsGroup[] = [
  'general',
  'seo',
  'imports',
  'ai_intelligence',
  'lifecycle_publishing',
  'media',
  'performance',
  'security',
  'feature_flags',
  'audit_logs',
];

export interface IPlatformSettings extends Document {
  group: SettingsGroup;
  data: Record<string, any>;
  updated_by?: string;
  updated_at: Date;
}

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    group: {
      type: String,
      required: true,
      unique: true,
      enum: SETTINGS_GROUPS,
    },
    data: { type: Schema.Types.Mixed, required: true, default: {} },
    updated_by: { type: String },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const PlatformSettings = model<IPlatformSettings>('PlatformSettings', platformSettingsSchema);
