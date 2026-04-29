import { Document, Schema, model } from 'mongoose';

export interface IUserSession extends Document {
  session_id: string;
  user_id: string;
  refresh_token: string;
  expires_at: Date;
  is_revoked: boolean;
  device_info?: string;
  ip_address?: string;
  revoked_at?: Date;
}

const userSessionSchema = new Schema<IUserSession>(
  {
    session_id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    refresh_token: { type: String, required: true },
    expires_at: { type: Date, required: true },
    is_revoked: { type: Boolean, default: false },
    device_info: { type: String },
    ip_address: { type: String },
    revoked_at: { type: Date },
  },
  { timestamps: true }
);

userSessionSchema.index({ user_id: 1 });
userSessionSchema.index({ refresh_token: 1 });
userSessionSchema.index({ is_revoked: 1 });
userSessionSchema.index({ expires_at: 1 });
userSessionSchema.index({ user_id: 1, is_revoked: 1, expires_at: 1 });
userSessionSchema.index({ expires_at: 1, is_revoked: 1 });
userSessionSchema.index({ ip_address: 1 });

export const UserSession = model<IUserSession>('UserSession', userSessionSchema);
