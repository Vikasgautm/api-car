import { DeletionAction, IDeletionRequest } from '../../../models/deletion-request.model';
import { AuditActor } from '../../../shared/utils/audit.util';
export interface CreateRequestInput {
    entity_type: 'car';
    entity_id: string;
    action: DeletionAction;
    reason?: string;
    redirect_to_slug?: string;
}
export interface CreateRequestResult {
    request_id: string;
    channel: 'email' | 'console';
    sent_to_masked: string;
    expires_at: Date;
    fallback_used: boolean;
}
export declare class DeletionWorkflowService {
    /**
     * Create a deletion request. Generates an OTP, persists its hash, sends the
     * code via email (or dev-console fallback), and writes an audit row. The OTP
     * itself is never returned.
     */
    static create(input: CreateRequestInput, actor: AuditActor & {
        user_id: string;
    }): Promise<CreateRequestResult>;
    /**
     * Verify the OTP for a pending request. On success, apply the action and mark
     * the request approved. Increments attempts and locks out after `otp_max_attempts`.
     */
    static verify(requestId: string, otpInput: string, actor: AuditActor & {
        user_id: string;
    }): Promise<{
        request: import("mongoose").Document<unknown, {}, IDeletionRequest, {}, import("mongoose").DefaultSchemaOptions> & IDeletionRequest & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        applied: (import("mongoose").Document<unknown, {}, import("../../../models/car.model").ICar, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car.model").ICar & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        }) | (import("../../../models/car.model").ICar & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        }) | null;
    }>;
    /**
     * Cancel a pending request without touching the entity.
     */
    static cancel(requestId: string, reason: string | undefined, actor: AuditActor & {
        user_id: string;
    }): Promise<import("mongoose").Document<unknown, {}, IDeletionRequest, {}, import("mongoose").DefaultSchemaOptions> & IDeletionRequest & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    /** List requests (admins see all; non-admins see only their own). */
    static list(params: {
        page?: number;
        limit?: number;
        status?: IDeletionRequest['status'];
        entity_id?: string;
        actor: AuditActor & {
            user_id: string;
        };
    }): Promise<{
        requests: (IDeletionRequest & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    /**
     * Apply the requested status transition on the Car. Audit rows are written by
     * the lifecycle helpers + a single 'archive'/'disable'/'discontinue'/'delete'
     * event from here.
     */
    private static applyAction;
}
//# sourceMappingURL=deletion-workflow.service.d.ts.map