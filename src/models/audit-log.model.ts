import { Document, Schema, model } from 'mongoose';

export type AuditEntityType =
  | 'car'
  | 'variant'
  | 'tag'
  | 'tag_category'
  | 'benchmark_override';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'
  | 'archive'
  | 'unarchive'
  | 'publish'
  | 'unpublish'
  | 'mark_launched'
  | 'mark_upcoming'
  | 'mark_reviewed';

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

const auditLogSchema = new Schema<IAuditLog>(
  {
    audit_id: { type: String, required: true, unique: true },
    entity_type: { type: String, required: true },
    entity_id: { type: String, required: true },
    action: { type: String, required: true },
    field: { type: String, default: null },
    old_value: { type: Schema.Types.Mixed, default: null },
    new_value: { type: Schema.Types.Mixed, default: null },
    actor_user_id: { type: String, default: null },
    actor_email: { type: String, default: null },
    actor_role: { type: String, default: null },
    ip: { type: String, default: null },
    user_agent: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

auditLogSchema.index({ entity_type: 1, entity_id: 1, timestamp: -1 });
auditLogSchema.index({ actor_user_id: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
// TTL: automatically delete audit logs older than 90 days
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
