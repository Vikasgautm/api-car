import { Document } from 'mongoose';
export type AuditEntityType = 'car' | 'variant' | 'tag' | 'tag_category' | 'benchmark_override' | 'blog';
export type AuditAction = 'create' | 'update' | 'delete' | 'restore' | 'archive' | 'unarchive' | 'publish' | 'unpublish' | 'mark_launched' | 'mark_upcoming' | 'mark_reviewed';
export interface IAuditLog extends Document {
    audit_id: string;
    entity_type: AuditEntityType;
    entity_id: string;
    action: AuditAction;
    field?: string | null;
    old_value?: any;
    new_value?: any;
    actor_user_id?: string | null;
    actor_email?: string | null;
    actor_role?: string | null;
    ip?: string | null;
    user_agent?: string | null;
    timestamp: Date;
}
export declare const AuditLog: import("mongoose").Model<IAuditLog, {}, {}, {}, Document<unknown, {}, IAuditLog, {}, import("mongoose").DefaultSchemaOptions> & IAuditLog & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IAuditLog>;
//# sourceMappingURL=audit-log.model.d.ts.map