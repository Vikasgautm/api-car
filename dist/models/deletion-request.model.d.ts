export type DeletionEntityType = 'car';
export type DeletionAction = 'archive' | 'disable' | 'discontinue' | 'hard_delete';
export type DeletionStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
export type OtpDeliveryChannel = 'email' | 'console';
export interface IDeletionRequest {
    request_id: string;
    entity_type: DeletionEntityType;
    entity_id: string;
    action: DeletionAction;
    reason?: string | null;
    redirect_to_slug?: string | null;
    requested_by_user_id: string;
    requested_by_email?: string | null;
    requested_by_role?: string | null;
    otp_hash: string;
    otp_expires_at: Date;
    otp_attempts: number;
    otp_max_attempts: number;
    otp_channel: OtpDeliveryChannel;
    otp_sent_to?: string | null;
    status: DeletionStatus;
    approved_by_user_id?: string | null;
    approved_at?: Date | null;
    cancelled_at?: Date | null;
    cancellation_reason?: string | null;
}
import { BaseModel } from '../sql/common/BaseModel';
export declare const DeletionRequest: BaseModel<IDeletionRequest>;
