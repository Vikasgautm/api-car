import { Document, Schema, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { EntityLifecycleState } from './car.model';

export type LifecycleRequestStatus =
  | 'pending'       // waiting for super_admin action
  | 'otp_pending'   // super_admin approved; OTP verification required before execution
  | 'approved'      // transition executed
  | 'rejected'      // rejected by super_admin
  | 'cancelled'     // cancelled by requester or admin
  | 'expired';      // OTP expired without verification

export interface ILifecycleRequest extends Document {
  request_id: string;
  car_id: string;
  car_name: string;
  car_slug: string;
  model_family: string | null;
  from_state: EntityLifecycleState;
  to_state: EntityLifecycleState;
  status: LifecycleRequestStatus;
  reason: string | null;

  // Requester
  requested_by_user_id: string;
  requested_by_email: string | null;
  requested_by_role: string | null;

  // OTP (selected: false — never included in default queries)
  otp_required: boolean;
  otp_hash: string | null;
  otp_expires_at: Date | null;
  otp_attempts: number;
  otp_max_attempts: number;
  otp_channel: 'email' | 'console' | null;
  otp_sent_to: string | null; // masked email returned to client; full stored here

  // Approval
  approved_by_user_id: string | null;
  approved_at: Date | null;
  rejected_by_user_id: string | null;
  rejected_at: Date | null;
  rejection_reason: string | null;
  cancelled_at: Date | null;
  cancellation_reason: string | null;

  // Override flag — for BLOCKED transitions (e.g. discontinued→launched)
  is_override: boolean;
  override_reason: string | null;

  // Direct super_admin action (skipped the pending queue)
  is_direct: boolean;
}

const lifecycleRequestSchema = new Schema<ILifecycleRequest>(
  {
    request_id: { type: String, default: () => uuidv4(), unique: true, index: true },
    car_id: { type: String, required: true, index: true },
    car_name: { type: String, required: true },
    car_slug: { type: String, required: true },
    model_family: { type: String, default: null },
    from_state: { type: String, required: true },
    to_state: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'otp_pending', 'approved', 'rejected', 'cancelled', 'expired'],
      default: 'pending',
      index: true,
    },
    reason: { type: String, default: null, maxlength: 1000 },

    requested_by_user_id: { type: String, required: true },
    requested_by_email: { type: String, default: null },
    requested_by_role: { type: String, default: null },

    otp_required: { type: Boolean, default: false },
    otp_hash: { type: String, select: false, default: null },
    otp_expires_at: { type: Date, default: null },
    otp_attempts: { type: Number, default: 0 },
    otp_max_attempts: { type: Number, default: 5 },
    otp_channel: { type: String, enum: ['email', 'console', null], default: null },
    otp_sent_to: { type: String, default: null },

    approved_by_user_id: { type: String, default: null },
    approved_at: { type: Date, default: null },
    rejected_by_user_id: { type: String, default: null },
    rejected_at: { type: Date, default: null },
    rejection_reason: { type: String, default: null, maxlength: 500 },
    cancelled_at: { type: Date, default: null },
    cancellation_reason: { type: String, default: null, maxlength: 500 },

    is_override: { type: Boolean, default: false },
    override_reason: { type: String, default: null, maxlength: 1000 },
    is_direct: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Prevent duplicate active requests for the same car + target state
lifecycleRequestSchema.index({ car_id: 1, status: 1 });
lifecycleRequestSchema.index({ requested_by_user_id: 1, createdAt: -1 });
lifecycleRequestSchema.index({ status: 1, createdAt: -1 });
lifecycleRequestSchema.index({ otp_expires_at: 1 });

export const LifecycleRequest = model<ILifecycleRequest>('LifecycleRequest', lifecycleRequestSchema);
