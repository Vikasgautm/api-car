import { AuditLog } from '../../../models/audit-log.model';
import { ActivityItem, DashboardRecentActivity } from '../dtos/dashboard.dto';

const ACTION_LABELS: Record<string, string> = {
  create: 'created',
  update: 'updated',
  delete: 'deleted',
  restore: 'restored',
  archive: 'archived',
  unarchive: 'unarchived',
  publish: 'published',
  unpublish: 'unpublished',
  mark_launched: 'launched',
  mark_upcoming: 'marked upcoming',
  mark_reviewed: 'reviewed',
};

const ENTITY_LABELS: Record<string, string> = {
  car: 'Car',
  variant: 'Variant',
  tag: 'Tag',
  tag_category: 'Tag Category',
  benchmark_override: 'Benchmark Override',
};

export class DashboardActivityService {
  static async getRecentActivity(limit = 20): Promise<DashboardRecentActivity> {
    const logs = await AuditLog.find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    const items: ActivityItem[] = logs.map((log) => {
      const entityLabel = ENTITY_LABELS[log.entity_type] ?? log.entity_type;
      const actionLabel = ACTION_LABELS[log.action] ?? log.action;
      return {
        activity_id: log.audit_id,
        title: `${entityLabel} ${actionLabel}`,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        action: log.action,
        actor_email: log.actor_email ?? null,
        timestamp: log.timestamp,
      };
    });

    return { items };
  }
}
