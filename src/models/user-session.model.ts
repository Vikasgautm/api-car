import { Schema, model, Document } from 'mongoose';

export interface IUserSession extends Document {
  user_session_id: string;
  user_uuid: string;
  refresh_token: string;
  expiry_date: Date;
  is_active: boolean;
}

const userSessionSchema = new Schema<IUserSession>(
  {
    user_session_id: { type: String, required: true, unique: true },
    user_uuid: { type: String, ref: 'User', required: true },
    refresh_token: { type: String },
    expiry_date: { type: Date },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const UserSession = model<IUserSession>('UserSession', userSessionSchema);
