import { IRedirect } from '../../../models/redirect.model';
import { AuditActor } from '../../../shared/utils/audit.util';
export interface CreateRedirectInput {
    old_url: string;
    new_url: string;
    type?: '301' | '302';
    reason?: string;
}
export interface UpdateRedirectInput {
    old_url?: string;
    new_url?: string;
    type?: '301' | '302';
    reason?: string | null;
}
export declare class RedirectService {
    /**
     * Resolve a URL through the redirect table, returning the final destination.
     * Walks at most `maxHops` rows so a chain (which we try to prevent on write)
     * still can't loop the request forever if one slips in.
     */
    static resolve(url: string, maxHops?: number): Promise<{
        new_url: string;
        type: '301' | '302';
        redirect_id: string;
    } | null>;
    /** Fire-and-forget metrics update so resolution stays fast. */
    static recordHit(redirect_id: string): void;
    static list(params: {
        page?: number;
        limit?: number;
        q?: string;
        is_deleted?: boolean | string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        redirects: (IRedirect & import("../../../sql/common/BaseModel").SQLDocument)[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getById(redirect_id: string): Promise<(IRedirect & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static create(input: CreateRedirectInput, actor: AuditActor | null): Promise<any>;
    static update(redirect_id: string, input: UpdateRedirectInput, actor: AuditActor | null): Promise<(IRedirect & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static softDelete(redirect_id: string, actor: AuditActor | null): Promise<IRedirect & import("../../../sql/common/BaseModel").SQLDocument>;
    static restore(redirect_id: string, actor: AuditActor | null): Promise<(IRedirect & import("../../../sql/common/BaseModel").SQLDocument) | null>;
}
export type { IRedirect };
