import { v4 as uuidv4 } from 'uuid';
import { AuditAction, AuditEntityType, AuditLog } from '../../models/audit-log.model';

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

/**
 * Deep-equality check sized for primitives, dates, plain arrays/objects.
 * Doesn't try to compare circular refs or class instances — those don't occur
 * in mongoose `.toObject()` output we hand it.
 */
function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a == null && b == null;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof Date || b instanceof Date) {
    const aTime = a instanceof Date ? a.getTime() : new Date(a as any).getTime();
    const bTime = b instanceof Date ? b.getTime() : new Date(b as any).getTime();
    return Number.isFinite(aTime) && Number.isFinite(bTime) && aTime === bTime;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!isEqual(a[i], b[i])) return false;
    return true;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);
    if (aKeys.length !== bKeys.length) return false;
    for (const k of aKeys) if (!isEqual((a as any)[k], (b as any)[k])) return false;
    return true;
  }
  return false;
}

function readPath(obj: Record<string, any> | null | undefined, path: string): unknown {
  if (!obj) return undefined;
  if (!path.includes('.')) return obj[path];
  return path.split('.').reduce<any>((acc, key) => (acc == null ? acc : acc[key]), obj);
}

export class AuditUtil {
  /**
   * Compare two snapshots and persist one audit row per changed field. Returns the
   * number of rows written. Designed to never throw — audit failures should not
   * block the user's actual save.
   */
  static async recordChanges(params: RecordChangesParams): Promise<number> {
    try {
      const { entity_type, entity_id, before, after, fieldsToTrack, actor, action = 'update' } = params;
      if (!after) return 0;

      const docs: any[] = [];
      const timestamp = new Date();

      for (const field of fieldsToTrack) {
        const oldVal = readPath(before ?? {}, field);
        const newVal = readPath(after ?? {}, field);
        if (oldVal === undefined && newVal === undefined) continue;
        if (isEqual(oldVal, newVal)) continue;

        docs.push({
          audit_id: uuidv4(),
          entity_type,
          entity_id,
          action,
          field,
          old_value: oldVal === undefined ? null : oldVal,
          new_value: newVal === undefined ? null : newVal,
          actor_user_id: actor?.user_id ?? null,
          actor_email: actor?.email ?? null,
          actor_role: actor?.role ?? null,
          ip: actor?.ip ?? null,
          user_agent: actor?.user_agent ?? null,
          timestamp,
        });
      }

      if (docs.length === 0) return 0;
      await AuditLog.insertMany(docs, { ordered: false });
      return docs.length;
    } catch (err) {
      console.error('AuditUtil.recordChanges failed', err);
      return 0;
    }
  }

  /**
   * Record a single non-field event (create/delete/publish/archive/etc.).
   */
  static async recordEvent(params: RecordEventParams): Promise<void> {
    try {
      await AuditLog.create({
        audit_id: uuidv4(),
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        action: params.action,
        field: params.field ?? null,
        old_value: params.old_value ?? null,
        new_value: params.new_value ?? null,
        actor_user_id: params.actor?.user_id ?? null,
        actor_email: params.actor?.email ?? null,
        actor_role: params.actor?.role ?? null,
        ip: params.actor?.ip ?? null,
        user_agent: params.actor?.user_agent ?? null,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('AuditUtil.recordEvent failed', err);
    }
  }

  /**
   * Build an AuditActor from an Express request (req.user is populated by `protect`).
   */
  static actorFromRequest(req: { user?: { user_id?: string; id?: string; email?: string; role?: string } | null; ip?: string; headers?: Record<string, any> }): AuditActor {
    return {
      user_id: req.user?.user_id || req.user?.id || null,
      email: req.user?.email || null,
      role: req.user?.role || null,
      ip: req.ip || null,
      user_agent: req.headers?.['user-agent'] || null,
    };
  }
}

/** Fields tracked when a Car is updated. */
export const CAR_AUDIT_FIELDS = [
  'name',
  'slug',
  'brand_id',
  'body_type_id',
  'fuel_type_id',
  'short_description',
  'description',
  'status',
  'is_upcoming',
  'is_launched',
  'is_electric',
  'is_published',
  'is_featured',
  'is_popular',
  'is_recommended',
  'is_latest',
  'top_selling',
  'expected_exshowroom_price',
  'expected_launch_date',
  'exshowroom_price',
  'launch_date',
  'tag_ids',
  'editor_user_id',
  'seo_owner_user_id',
  'reviewer_user_id',
  'meta_title',
  'meta_description',
  'meta_keywords',
  'og_image',
  'canonical_url',
  'noindex',
  'model_family',
  'generation_start_year',
  'generation_end_year',
  'generation_label',
  'is_current',
  'is_facelift',
  'predecessor_car_id',
  'successor_car_id',
];

/**
 * Fields tracked when a CarVariant is updated. specs_normalized is intentionally
 * left out — its diff is too large to be useful row-by-row. Instead the audit
 * caller emits a single 'specs_normalized' marker row when the blob changes.
 */
export const VARIANT_AUDIT_FIELDS = [
  'variant_name',
  'slug',
  'car_id',
  'model_year',
  'fuel_type_id',
  'transmission_type',
  'drivetrain',
  'seating_capacity',
  'body_type',
  'ex_showroom_price',
  'expected_price',
  'expected_launch_date',
  'is_published',
  'is_archived',
  'hidden_spec_keys',
  'hidden_sections',
  'editor_user_id',
  'seo_owner_user_id',
  'reviewer_user_id',
  'meta_title',
  'meta_description',
  'meta_keywords',
  'og_image',
  'canonical_url',
  'noindex',
];
