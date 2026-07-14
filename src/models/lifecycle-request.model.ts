import { v4 as uuidv4 } from 'uuid';
import { EntityLifecycleState } from './car.model';

export type LifecycleRequestStatus =
  | 'pending'       // waiting for super_admin action
  | 'otp_pending'   // super_admin approved; OTP verification required before execution
  | 'approved'      // transition executed
  | 'rejected'      // rejected by super_admin
  | 'cancelled'     // cancelled by requester or admin
  | 'expired';      // OTP expired without verification

export interface ILifecycleRequest  {
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

import { BaseModel } from '../sql/common/BaseModel';
export const LifecycleRequest = new BaseModel<ILifecycleRequest>('LifecycleRequests', 'request_id', ['metadata']);
