import { Document, Schema, model } from 'mongoose';

export interface IEditLock extends Document {
  lock_id: string;
  entity_type: string;
  entity_id: string;
  locked_by: string;
  locked_by_name: string;
  locked_by_email: string;
  expires_at: Date;
}

const editLockSchema = new Schema<IEditLock>(
  {
    lock_id: { type: String, required: true, unique: true },
    entity_type: { type: String, required: true },
    entity_id: { type: String, required: true },
    locked_by: { type: String, required: true },
    locked_by_name: { type: String, required: true },
    locked_by_email: { type: String, default: '' },
    expires_at: { type: Date, required: true },
  },
  { timestamps: true }
);

editLockSchema.index({ entity_type: 1, entity_id: 1 }, { unique: true });
editLockSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
editLockSchema.index({ locked_by: 1 });

export const EditLock = model<IEditLock>('EditLock', editLockSchema);
