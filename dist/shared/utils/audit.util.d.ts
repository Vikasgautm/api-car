import { AuditAction, AuditEntityType } from '../../models/audit-log.model';
export interface AuditActor {
    user_id?: string | null;
    email?: string | null;
    role?: string | null;
    ip?: string | null;
    user_agent?: string | null;
}
interface RecordChangesParams {
    entity_type: AuditEntityType;
    entity_id: string;
    before: Record<string, any> | null | undefined;
    after: Record<string, any> | null | undefined;
    fieldsToTrack: string[];
    actor?: AuditActor | null;
    action?: AuditAction;
}
interface RecordEventParams {
    entity_type: AuditEntityType;
    entity_id: string;
    action: AuditAction;
    actor?: AuditActor | null;
    field?: string | null;
    old_value?: any;
    new_value?: any;
}
export declare class AuditUtil {
    /**
     * Compare two snapshots and persist one audit row per changed field. Returns the
     * number of rows written. Designed to never throw — audit failures should not
     * block the user's actual save.
     */
    static recordChanges(params: RecordChangesParams): Promise<number>;
    /**
     * Record a single non-field event (create/delete/publish/archive/etc.).
     */
    static recordEvent(params: RecordEventParams): Promise<void>;
    /**
     * Build an AuditActor from an Express request (req.user is populated by `protect`).
     */
    static actorFromRequest(req: {
        user?: {
            user_id?: string;
            id?: string;
            email?: string;
            role?: string;
        } | null;
        ip?: string;
        headers?: Record<string, any>;
    }): AuditActor;
}
/** Fields tracked when a Car is updated. */
export declare const CAR_AUDIT_FIELDS: string[];
/**
 * Fields tracked when a CarVariant is updated. specs_normalized is intentionally
 * left out — its diff is too large to be useful row-by-row. Instead the audit
 * caller emits a single 'specs_normalized' marker row when the blob changes.
 */
export declare const VARIANT_AUDIT_FIELDS: string[];
export {};
