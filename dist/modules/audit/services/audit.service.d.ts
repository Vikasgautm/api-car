import { AuditEntityType } from '../../../models/audit-log.model';
import { AuditActor } from '../../../shared/utils/audit.util';
export interface AuditListParams {
    page?: number;
    limit?: number;
    entity_type?: AuditEntityType;
    entity_id?: string;
    actor_user_id?: string;
    action?: string;
    since?: string;
}
export declare class AuditService {
    static list(params: AuditListParams): Promise<{
        logs: (import("../../../models/audit-log.model").IAuditLog & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    /**
     * Cars / variants whose last_reviewed_at is older than `staleAfterDays`
     * (or has never been reviewed). Returns lean docs limited for display.
     */
    static getStaleContent(staleAfterDays: number, limit?: number): Promise<{
        cars: (import("../../../models/car.model").ICar & import("../../../sql/common/BaseModel").SQLDocument)[];
        variants: (import("../../../models/car-variant.model").ICarVariant & import("../../../sql/common/BaseModel").SQLDocument)[];
        stale_after_days: number;
    }>;
    /**
     * Mark a car or variant as reviewed by the actor. Writes a 'mark_reviewed'
     * audit event so the timeline shows who signed off.
     */
    static markReviewed(entityType: 'car' | 'variant', entityId: string, actor: AuditActor | null): Promise<(import("../../../models/car.model").ICar & import("../../../sql/common/BaseModel").SQLDocument) | (import("../../../models/car-variant.model").ICarVariant & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    /**
     * Resolve a set of user_id values to a `{ user_id -> { user_name, email } }` map.
     * Used to hydrate display names in audit log responses without N queries.
     */
    static hydrateUserNames(userIds: string[]): Promise<Record<string, {
        user_name: string;
        email: string;
    }>>;
}
