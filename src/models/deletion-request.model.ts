import { Document, Schema, model } from 'mongoose';

export type DeletionEntityType = 'car';
export type DeletionAction = 'archive' | 'disable' | 'discontinue' | 'hard_delete';
export type DeletionStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
export type OtpDeliveryChannel = 'whatsapp' | 'console';

export interface IDeletionRequest extends Document {
  request_id: string;
  entity_type: DeletionEntityType;
  entity_id: string;
  action: DeletionAction;
  reason?: string | null;
  redirect_to_slug?: string | null;

  // Initiator
  requested_by_user_id: string;
  requested_by_email?: string | null;
  requested_by_role?: string | null;

  // OTP
  otp_hash: string;
  otp_expires_at: Date;
  otp_attempts: number;
  otp_max_attempts: number;
  otp_channel: OtpDeliveryChannel;
  otp_sent_to?: string | null; // phone or 'console'

  status: DeletionStatus;
  approved_by_user_id?: string | null;
  approved_at?: Date | null;
  cancelled_at?: Date | null;
  cancellation_reason?: string | null;
}

const deletionRequestSchema = new Schema<IDeletionRequest>(
  {
    request_id: { type: String, required: true, unique: true },
    entity_type: { type: String, required: true, enum: ['car'] },
    entity_id: { type: String, required: true },
    action: { type: String, required: true, enum: ['archive', 'disable', 'discontinue', 'hard_delete'] },
    reason: { type: String, default: null, maxlength: 500 },
    redirect_to_slug: { type: String, default: null },

    requested_by_user_id: { type: String, required: true },
    requested_by_email: { type: String, default: null },
    requested_by_role: { type: String, default: null },

    otp_hash: { type: String, required: true, select: false },
    otp_expires_at: { type: Date, required: true },
    otp_attempts: { type: Number, default: 0 },
    otp_max_attempts: { type: Number, default: 5 },
    otp_channel: { type: String, required: true, enum: ['whatsapp', 'console'] },
    otp_sent_to: { type: String, default: null },

    status: { type: String, required: true, enum: ['pending', 'approved', 'rejected', 'expired', 'cancelled'], default: 'pending' },
    approved_by_user_id: { type: String, default: null },
    approved_at: { type: Date, default: null },
    cancelled_at: { type: Date, default: null },
    cancellation_reason: { type: String, default: null },
  },
  { timestamps: true }
);

deletionRequestSchema.index({ entity_type: 1, entity_id: 1, status: 1 });
deletionRequestSchema.index({ requested_by_user_id: 1, createdAt: -1 });
deletionRequestSchema.index({ status: 1, createdAt: -1 });
deletionRequestSchema.index({ otp_expires_at: 1 });

export const DeletionRequest = model<IDeletionRequest>('DeletionRequest', deletionRequestSchema);
