import { EntityLifecycleState } from '../../../models/car.model';
import { ILifecycleRequest, LifecycleRequestStatus } from '../../../models/lifecycle-request.model';
import { AuditActor } from '../../../shared/utils/audit.util';
export interface CreateLifecycleRequestInput {
    car_id: string;
    to_state: EntityLifecycleState;
    reason?: string;
    is_override?: boolean;
    override_reason?: string;
    acknowledged_warning: boolean;
}
export interface CreateLifecycleRequestResult {
    request_id: string;
    status: LifecycleRequestStatus;
    otp_sent_to_masked?: string;
    transition_applied?: boolean;
}
export declare class LifecycleGovernanceService {
    /**
     * Create a lifecycle change request.
     *
     * - Non-super-admin: creates a pending request awaiting super_admin approval.
     * - Super-admin (no OTP required): directly executes the transition, returns approved.
     * - Super-admin (OTP required): generates OTP, sends email, returns otp_pending.
     */
    static createRequest(input: CreateLifecycleRequestInput, actor: AuditActor & {
        user_id: string;
    }): Promise<CreateLifecycleRequestResult>;
    /**
     * Super-admin approves a pending request.
     * - If OTP not required: executes immediately.
     * - If OTP required: sends OTP, returns otp_pending.
     */
    static approveRequest(requestId: string, actor: AuditActor & {
        user_id: string;
    }): Promise<CreateLifecycleRequestResult>;
    /**
     * Verify OTP and execute the lifecycle transition.
     * Used for both direct super-admin actions and approval flow.
     */
    static verifyOTP(requestId: string, otpInput: string, actor: AuditActor & {
        user_id: string;
    }): Promise<CreateLifecycleRequestResult>;
    static rejectRequest(requestId: string, rejectionReason: string | undefined, actor: AuditActor & {
        user_id: string;
    }): Promise<ILifecycleRequest>;
    static cancelRequest(requestId: string, reason: string | undefined, actor: AuditActor & {
        user_id: string;
    }): Promise<ILifecycleRequest>;
    static listRequests(params: {
        page?: number;
        limit?: number;
        status?: LifecycleRequestStatus;
        car_id?: string;
        actor: AuditActor & {
            user_id: string;
        };
    }): Promise<{
        requests: (ILifecycleRequest & import("../../../sql/common/BaseModel").SQLDocument)[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getPendingForCar(carId: string): Promise<(ILifecycleRequest & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    private static _sendOtpForRequest;
    private static _sendOtpForExistingRequest;
}
