import { AuditEntityType, AuditLog } from '../../../models/audit-log.model';
import { Blog } from '../../../models/blog.model';
import { Brand } from '../../../models/brand.model';
import { Car } from '../../../models/car.model';
import { CarVariant } from '../../../models/car-variant.model';
import { Comparison } from '../../../models/comparison.model';
import { FAQ } from '../../../models/faq.model';
import { ImportLog } from '../../../models/import-log.model';
import { SeoCollection } from '../../../models/seo-collection.model';
import { Tag } from '../../../models/tag.model';
import { PaginationUtil } from '../../../shared/utils/pagination.util';
import { ContentHealthService } from '../../content-health/services/content-health.service';
import { AuditService } from './audit.service';

/**
 * Audit & Operations Center aggregation layer.
 *
 * This service does NOT introduce new collections. It aggregates existing
 * sources (AuditLog, ImportLog, ContentHealth, lifecycle + SEO collection
 * state) into the views the unified /audit page needs. Everything is computed
 * on demand — no alerts or activity snapshots are ever stored.
 */

export interface ActivityParams {
  page?: number;
  limit?: number;
  entity_type?: string;
  entity_id?: string;
  action?: string;
  actor_user_id?: string;
  from?: string;
  to?: string;
}

export interface ChangeItem {
  field: string | null;
  old_value: unknown;
  new_value: unknown;
  audit_id: string;
}

export interface ActivityEvent {
  event_key: string;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  action: string;
  timestamp: Date;
  actor_user_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  actor_role: string | null;
  changes: ChangeItem[];
  change_count: number;
}

type EntityKey = `${string}:${string}`;

export class AuditOperationsService {
  // ── Entity name resolution ────────────────────────────────────────────────
  /**
   * Resolve `{ entity_type, entity_id }` pairs to human-readable names in batch,
   * one query per entity type. Returns a `"type:id" -> name` map.
   */
  static async resolveEntityNames(
    pairs: Array<{ entity_type: string; entity_id: string }>,
  ): Promise<Record<EntityKey, string>> {
    const byType: Record<string, Set<string>> = {};
    for (const { entity_type, entity_id } of pairs) {
      if (!entity_id) continue;
      (byType[entity_type] ??= new Set()).add(entity_id);
    }

    const result: Record<EntityKey, string> = {};
    const add = (type: string, id: string, name: string) => {
      if (id && name) result[`${type}:${id}`] = name;
    };

    const tasks: Promise<void>[] = [];

    if (byType.car) {
      const ids = Array.from(byType.car);
      tasks.push(
        Car.find({ car_id: { $in: ids } }).select('car_id name').lean().then((rows) => {
          rows.forEach((r) => add('car', r.car_id, r.name));
        }),
      );
    }
    if (byType.variant) {
      const ids = Array.from(byType.variant);
      tasks.push(
        CarVariant.find({ variant_id: { $in: ids } }).select('variant_id variant_name').lean().then((rows) => {
          rows.forEach((r) => add('variant', r.variant_id, r.variant_name));
        }),
      );
    }
    if (byType.brand) {
      const ids = Array.from(byType.brand);
      tasks.push(
        Brand.find({ brand_id: { $in: ids } }).select('brand_id name').lean().then((rows) => {
          rows.forEach((r) => add('brand', r.brand_id, r.name));
        }),
      );
    }
    if (byType.comparison) {
      const ids = Array.from(byType.comparison);
      tasks.push(
        Comparison.find({ comparison_id: { $in: ids } }).select('comparison_id title').lean().then((rows) => {
          rows.forEach((r) => add('comparison', r.comparison_id, r.title));
        }),
      );
    }
    if (byType.seo_collection) {
      const ids = Array.from(byType.seo_collection);
      tasks.push(
        SeoCollection.find({ collection_id: { $in: ids } }).select('collection_id title').lean().then((rows) => {
          rows.forEach((r) => add('seo_collection', r.collection_id, r.title));
        }),
      );
    }
    if (byType.faq) {
      const ids = Array.from(byType.faq);
      tasks.push(
        FAQ.find({ faq_id: { $in: ids } }).select('faq_id question').lean().then((rows) => {
          rows.forEach((r) => add('faq', r.faq_id, r.question));
        }),
      );
    }
    if (byType.blog) {
      const ids = Array.from(byType.blog);
      tasks.push(
        Blog.find({ blog_id: { $in: ids } }).select('blog_id title').lean().then((rows) => {
          rows.forEach((r) => add('blog', r.blog_id, r.title));
        }),
      );
    }
    if (byType.tag) {
      const ids = Array.from(byType.tag);
      tasks.push(
        Tag.find({ tag_id: { $in: ids } }).select('tag_id name').lean().then((rows) => {
          rows.forEach((r) => add('tag', r.tag_id, r.name));
        }),
      );
    }

    await Promise.all(tasks);
    return result;
  }

  // ── TAB 1 + 2: Activity timeline (grouped events) ──────────────────────────
  /**
   * Group per-field AuditLog rows into events. recordChanges() writes one row
   * per field with an identical timestamp for a single save, so grouping by
   * (entity, action, timestamp, actor) reconstructs the original action and its
   * full set of field changes — powering both the timeline and Change Inspector.
   */
  static async getActivity(params: ActivityParams) {
    const { page = 1, limit = 25 } = params;
    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);

    const match: Record<string, unknown> = {};
    if (params.entity_type) match.entity_type = params.entity_type;
    if (params.entity_id) match.entity_id = params.entity_id;
    if (params.action) match.action = params.action;
    if (params.actor_user_id) match.actor_user_id = params.actor_user_id;
    const timeFilter: Record<string, Date> = {};
    if (params.from) {
      const d = new Date(params.from);
      if (!Number.isNaN(d.getTime())) timeFilter.$gte = d;
    }
    if (params.to) {
      const d = new Date(params.to);
      if (!Number.isNaN(d.getTime())) timeFilter.$lte = d;
    }
    if (Object.keys(timeFilter).length) match.timestamp = timeFilter;

    const pipeline: any[] = [
      { $match: match },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: {
            entity_type: '$entity_type',
            entity_id: '$entity_id',
            action: '$action',
            timestamp: '$timestamp',
            actor_user_id: '$actor_user_id',
          },
          changes: {
            $push: {
              field: '$field',
              old_value: '$old_value',
              new_value: '$new_value',
              audit_id: '$audit_id',
            },
          },
          actor_email: { $first: '$actor_email' },
          actor_role: { $first: '$actor_role' },
          timestamp: { $first: '$timestamp' },
        },
      },
      { $sort: { timestamp: -1 } },
      {
        $facet: {
          events: [{ $skip: skip }, { $limit: validatedLimit }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ];

    const [agg] = await AuditLog.aggregate(pipeline);
    const rawEvents: any[] = agg?.events ?? [];
    const total = agg?.totalCount?.[0]?.count ?? 0;

    const events = await this.hydrateEvents(rawEvents);

    return {
      events,
      pagination: PaginationUtil.createPaginationMeta(page, validatedLimit, total),
    };
  }

  /** Attach resolved entity names + actor names to raw aggregation rows. */
  private static async hydrateEvents(rawEvents: any[]): Promise<ActivityEvent[]> {
    const namePairs = rawEvents.map((e) => ({
      entity_type: e._id.entity_type,
      entity_id: e._id.entity_id,
    }));
    const actorIds = rawEvents
      .map((e) => e._id.actor_user_id)
      .filter((id): id is string => !!id);

    const [nameMap, userMap] = await Promise.all([
      this.resolveEntityNames(namePairs),
      AuditService.hydrateUserNames(actorIds),
    ]);

    return rawEvents.map((e) => {
      const { entity_type, entity_id, action, actor_user_id, timestamp } = e._id;
      const changes: ChangeItem[] = (e.changes ?? []).filter((c: ChangeItem) => c.field != null);
      return {
        event_key: `${entity_type}:${entity_id}:${action}:${new Date(timestamp).getTime()}`,
        entity_type,
        entity_id,
        entity_name: nameMap[`${entity_type}:${entity_id}`] ?? null,
        action,
        timestamp,
        actor_user_id: actor_user_id ?? null,
        actor_name: actor_user_id ? userMap[actor_user_id]?.user_name ?? null : null,
        actor_email: e.actor_email ?? null,
        actor_role: e.actor_role ?? null,
        changes,
        change_count: changes.length,
      };
    });
  }

  // ── TAB 3: Import monitoring ────────────────────────────────────────────────
  /**
   * Confidence is derived (ImportLog has no stored score): the share of fields
   * that matched vs. total fields seen. Returns 0–100 or null when unknown.
   */
  private static deriveConfidence(log: {
    matched_data?: Record<string, unknown>;
    unmatched_data?: Record<string, unknown>;
  }): number | null {
    const matched = Object.keys(log.matched_data ?? {}).length;
    const unmatched = Object.keys(log.unmatched_data ?? {}).length;
    const totalSeen = matched + unmatched;
    if (totalSeen === 0) return null;
    return Math.round((matched / totalSeen) * 100);
  }

  static async getImports(params: {
    page?: number;
    limit?: number;
    status?: string;
    import_type?: string;
    source?: string;
  }) {
    const { page = 1, limit = 25 } = params;
    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);

    const filter: Record<string, unknown> = {};
    if (params.status) filter.status = params.status;
    if (params.import_type) filter.import_type = params.import_type;
    if (params.source) filter.source = params.source;

    const [rows, total, statusCounts] = await Promise.all([
      ImportLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(validatedLimit).lean(),
      ImportLog.countDocuments(filter),
      ImportLog.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const counts: Record<string, number> = { previewed: 0, saved: 0, failed: 0 };
    for (const c of statusCounts) counts[c._id] = c.count;

    const actorIds = rows.map((r) => r.created_by).filter(Boolean);
    const userMap = await AuditService.hydrateUserNames(actorIds);

    const logs = rows.map((r) => {
      const confidence = this.deriveConfidence(r);
      return {
        import_id: r.import_id,
        source: r.source,
        import_type: r.import_type,
        source_url: r.source_url,
        car_id: r.car_id ?? null,
        variant_id: r.variant_id ?? null,
        status: r.status,
        confidence,
        is_low_confidence: confidence != null && confidence < 60,
        matched_count: Object.keys(r.matched_data ?? {}).length,
        unmatched_count: Object.keys(r.unmatched_data ?? {}).length,
        warning_count: (r.warnings ?? []).length,
        error_count: (r.error_messages ?? []).length,
        created_by: r.created_by,
        created_by_name: userMap[r.created_by]?.user_name ?? null,
        createdAt: r.createdAt,
      };
    });

    const lowConfidence = logs.filter((l) => l.is_low_confidence).length;

    return {
      summary: {
        successful: counts.saved,
        failed: counts.failed,
        previewed: counts.previewed,
        low_confidence_on_page: lowConfidence,
        total: counts.saved + counts.failed + counts.previewed,
      },
      logs,
      pagination: PaginationUtil.createPaginationMeta(page, validatedLimit, total),
    };
  }

  static async getImportDetail(importId: string): Promise<Record<string, unknown> | null> {
    const log = await ImportLog.findOne({ import_id: importId }).lean();
    if (!log) return null;
    const userMap = await AuditService.hydrateUserNames([log.created_by]);
    // Return only what the detail drawer renders — the raw extracted_data blob
    // can be megabytes and is never displayed, so it's deliberately excluded.
    return {
      import_id: log.import_id,
      source: log.source,
      import_type: log.import_type,
      source_url: log.source_url,
      car_id: log.car_id ?? null,
      variant_id: log.variant_id ?? null,
      status: log.status,
      confidence: this.deriveConfidence(log),
      created_by: log.created_by,
      created_by_name: userMap[log.created_by]?.user_name ?? null,
      createdAt: log.createdAt,
      matched_fields: Object.keys(log.matched_data ?? {}),
      unmatched_fields: Object.keys(log.unmatched_data ?? {}),
      warnings: log.warnings ?? [],
      error_messages: log.error_messages ?? [],
    };
  }

  // ── TAB 4: System alerts (generated on demand, never stored) ────────────────
  static async getAlerts() {
    const now = new Date();

    const [healthResult, overdueLaunches, seoCollections] = await Promise.all([
      ContentHealthService.getIssues({ page: 1, limit: 100 }).catch(() => null),
      Car.find({ is_deleted: false, is_upcoming: true, expected_launch_date: { $lte: now, $ne: null } })
        .select('car_id name expected_launch_date')
        .limit(25)
        .lean()
        .catch(() => []),
      SeoCollection.find({
        status: 'published',
        $or: [{ auto_noindex: true }, { health_score: { $lt: 50 } }],
      })
        .select('collection_id title health_score auto_noindex')
        .limit(25)
        .lean()
        .catch(() => []),
    ]);

    const alerts: Array<{
      id: string;
      source: string;
      severity: 'critical' | 'warning' | 'info';
      title: string;
      description: string;
      count: number;
      action_label: string;
      action_url: string;
    }> = [];

    const SEVERITY_MAP: Record<string, 'critical' | 'warning' | 'info'> = {
      critical: 'critical',
      high: 'warning',
      medium: 'info',
      low: 'info',
    };

    // Content / Import / SEO health issues grouped by category
    if (healthResult?.issues?.length) {
      const groups: Record<string, { count: number; topSeverity: string; title: string }> = {};
      const RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      for (const issue of healthResult.issues) {
        const g = (groups[issue.category] ??= {
          count: 0,
          topSeverity: issue.severity,
          title: issue.issue_title,
        });
        g.count += 1;
        if (RANK[issue.severity] < RANK[g.topSeverity]) {
          g.topSeverity = issue.severity;
          g.title = issue.issue_title;
        }
      }
      for (const [category, g] of Object.entries(groups)) {
        const sourceLabel = category.replace(/_/g, ' ').replace(/\bhealth\b/i, '').trim() || category;
        alerts.push({
          id: `health:${category}`,
          source: 'Content Health',
          severity: SEVERITY_MAP[g.topSeverity] ?? 'info',
          title: `${g.count} ${sourceLabel} issue${g.count === 1 ? '' : 's'}`,
          description: g.title,
          count: g.count,
          action_label: 'View in Content Health',
          action_url: `/content-health?category=${category}`,
        });
      }
    }

    // Lifecycle — overdue upcoming launches
    if (overdueLaunches.length) {
      alerts.push({
        id: 'lifecycle:overdue_launches',
        source: 'Lifecycle',
        severity: 'warning',
        title: `${overdueLaunches.length} upcoming launch${overdueLaunches.length === 1 ? '' : 'es'} overdue`,
        description: overdueLaunches
          .slice(0, 3)
          .map((c) => c.name)
          .join(', '),
        count: overdueLaunches.length,
        action_label: 'View Cars',
        action_url: '/cars?is_upcoming=true',
      });
    }

    // SEO collections — auto-noindexed or low health
    if (seoCollections.length) {
      const noindexed = seoCollections.filter((c) => c.auto_noindex).length;
      alerts.push({
        id: 'seo:collection_health',
        source: 'SEO Collections',
        severity: noindexed ? 'warning' : 'info',
        title: `${seoCollections.length} collection${seoCollections.length === 1 ? '' : 's'} need attention`,
        description: noindexed
          ? `${noindexed} auto-noindexed, others below health threshold`
          : 'Health score below threshold',
        count: seoCollections.length,
        action_label: 'View Collection Health',
        action_url: '/seo-collection-health',
      });
    }

    const order = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => order[a.severity] - order[b.severity]);

    return {
      alerts,
      counts: {
        critical: alerts.filter((a) => a.severity === 'critical').length,
        warning: alerts.filter((a) => a.severity === 'warning').length,
        info: alerts.filter((a) => a.severity === 'info').length,
        total: alerts.length,
      },
      generated_at: now.toISOString(),
    };
  }

  // ── TAB 6: Entity history ───────────────────────────────────────────────────
  static async searchEntities(q: string, limit = 8) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const results: Array<{ entity_type: string; entity_id: string; label: string; sub?: string }> = [];

    const [cars, variants, brands, comparisons, collections] = await Promise.all([
      Car.find({ is_deleted: false, name: rx }).select('car_id name slug').limit(limit).lean(),
      CarVariant.find({ is_deleted: false, variant_name: rx }).select('variant_id car_id variant_name').limit(limit).lean(),
      Brand.find({ name: rx }).select('brand_id name').limit(limit).lean(),
      Comparison.find({ title: rx }).select('comparison_id title').limit(limit).lean(),
      SeoCollection.find({ title: rx }).select('collection_id title').limit(limit).lean(),
    ]);

    cars.forEach((c) => results.push({ entity_type: 'car', entity_id: c.car_id, label: c.name, sub: 'Car' }));
    variants.forEach((v) =>
      results.push({ entity_type: 'variant', entity_id: v.variant_id, label: v.variant_name, sub: 'Variant' }),
    );
    brands.forEach((b) => results.push({ entity_type: 'brand', entity_id: b.brand_id, label: b.name, sub: 'Brand' }));
    comparisons.forEach((c) =>
      results.push({ entity_type: 'comparison', entity_id: c.comparison_id, label: c.title, sub: 'Comparison' }),
    );
    collections.forEach((c) =>
      results.push({ entity_type: 'seo_collection', entity_id: c.collection_id, label: c.title, sub: 'SEO Collection' }),
    );

    return results;
  }

  /**
   * Complete chronological history of an entity: audit events + related imports.
   * For a car, this also folds in audit events for all of its variants so the
   * timeline reflects the entire model, not just the parent record.
   */
  static async getEntityHistory(entityType: string, entityId: string) {
    // Collect the set of (type, id) pairs whose audit rows belong to this entity.
    const auditTargets: Array<{ entity_type: AuditEntityType; entity_id: string }> = [
      { entity_type: entityType as AuditEntityType, entity_id: entityId },
    ];

    let variantIds: string[] = [];
    if (entityType === 'car') {
      const variants = await CarVariant.find({ car_id: entityId }).select('variant_id').lean();
      variantIds = variants.map((v) => v.variant_id);
      variantIds.forEach((id) => auditTargets.push({ entity_type: 'variant', entity_id: id }));
    }

    const auditOr = auditTargets.map((t) => ({ entity_type: t.entity_type, entity_id: t.entity_id }));

    const [rawEvents, imports] = await Promise.all([
      AuditLog.aggregate([
        { $match: { $or: auditOr } },
        { $sort: { timestamp: -1 } },
        {
          $group: {
            _id: {
              entity_type: '$entity_type',
              entity_id: '$entity_id',
              action: '$action',
              timestamp: '$timestamp',
              actor_user_id: '$actor_user_id',
            },
            changes: {
              $push: { field: '$field', old_value: '$old_value', new_value: '$new_value', audit_id: '$audit_id' },
            },
            actor_email: { $first: '$actor_email' },
            actor_role: { $first: '$actor_role' },
            timestamp: { $first: '$timestamp' },
          },
        },
        { $sort: { timestamp: -1 } },
        { $limit: 200 },
      ]),
      ImportLog.find({
        $or: [
          { car_id: entityType === 'car' ? entityId : '__none__' },
          { variant_id: { $in: entityType === 'variant' ? [entityId] : variantIds } },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    const events = await this.hydrateEvents(rawEvents);

    const importEvents = imports.map((imp) => ({
      import_id: imp.import_id,
      source: imp.source,
      import_type: imp.import_type,
      status: imp.status,
      source_url: imp.source_url,
    }));

    // Unified, time-ordered timeline
    const timeline: Array<{ kind: 'audit' | 'import'; timestamp: Date; event: unknown }> = [
      ...events.map((e) => ({ kind: 'audit' as const, timestamp: e.timestamp, event: e as unknown })),
      ...imports.map((imp, i) => ({ kind: 'import' as const, timestamp: imp.createdAt, event: importEvents[i] as unknown })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const nameMap = await this.resolveEntityNames([{ entity_type: entityType, entity_id: entityId }]);

    return {
      entity_type: entityType,
      entity_id: entityId,
      entity_name: nameMap[`${entityType}:${entityId}`] ?? null,
      variant_count: variantIds.length,
      timeline,
    };
  }
}
