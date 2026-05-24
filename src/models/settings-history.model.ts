import { Document, Schema, model } from 'mongoose';

export interface ISettingsHistory extends Document {
  group: string;
  key?: string;
  old_value: any;
  new_value: any;
  updated_by: string;
  updated_by_name?: string;
  updated_at: Date;
  change_summary: string;
}

const settingsHistorySchema = new Schema<ISettingsHistory>(
  {
    group: { type: String, required: true, index: true },
    key: { type: String },
    old_value: { type: Schema.Types.Mixed },
    new_value: { type: Schema.Types.Mixed },
    updated_by: { type: String, required: true },
    updated_by_name: { type: String },
    updated_at: { type: Date, default: Date.now, index: true },
    change_summary: { type: String, required: true },
  },
  { timestamps: true }
);

settingsHistorySchema.index({ group: 1, updated_at: -1 });

export const SettingsHistory = model<ISettingsHistory>('SettingsHistory', settingsHistorySchema);
