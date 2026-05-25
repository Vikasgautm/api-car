import { AuditLog } from '../../../models/audit-log.model';
import { User } from '../../../models/user.model';

export interface ActivityFilters {
  user_id?: string;
  entity_type?: string;
  action?: string;
  brand_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export class UserActivityService {
  static async getUserActivity(userId: string, filters: ActivityFilters = {}) {
    const { page = 1, limit = 30, entity_type, action } = filters;
    const query: Record<string, any> = { actor_user_id: userId };

    if (entity_type) query.entity_type = entity_type;
    if (action) query.action = action;
    if (filters.date_from || filters.date_to) {
      query.timestamp = {};
      if (filters.date_from) query.timestamp.$gte = new Date(filters.date_from);
      if (filters.date_to) query.timestamp.$lte = new Date(filters.date_to);
    }

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(query),
    ]);

    return { logs, total, page, limit };
  }

  static async getAllActivity(filters: ActivityFilters = {}) {
    const { page = 1, limit = 30, user_id, entity_type, action } = filters;
    const query: Record<string, any> = {};

    if (user_id) query.actor_user_id = user_id;
    if (entity_type) query.entity_type = entity_type;
    if (action) query.action = action;
    if (filters.date_from || filters.date_to) {
      query.timestamp = {};
      if (filters.date_from) query.timestamp.$gte = new Date(filters.date_from);
      if (filters.date_to) query.timestamp.$lte = new Date(filters.date_to);
    }

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(query),
    ]);

    return { logs, total, page, limit };
  }

  static async getUserActivitySummary(userId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalEdits, todayEdits, weekEdits, byAction] = await Promise.all([
      AuditLog.countDocuments({ actor_user_id: userId }),
      AuditLog.countDocuments({ actor_user_id: userId, timestamp: { $gte: todayStart } }),
      AuditLog.countDocuments({ actor_user_id: userId, timestamp: { $gte: weekStart } }),
      AuditLog.aggregate([
        { $match: { actor_user_id: userId } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return {
      total_edits: totalEdits,
      today_edits: todayEdits,
      week_edits: weekEdits,
      by_action: byAction,
    };
  }

  static async getCrossUserActivitySummary() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [topEditors, recentActivity] = await Promise.all([
      AuditLog.aggregate([
        { $match: { actor_user_id: { $ne: null } } },
        { $group: { _id: '$actor_user_id', count: { $sum: 1 }, actor_email: { $last: '$actor_email' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      AuditLog.find({}).sort({ timestamp: -1 }).limit(50).select(
        'entity_type entity_id action actor_user_id actor_email timestamp'
      ),
    ]);

    return { top_editors: topEditors, recent_activity: recentActivity };
  }
}
