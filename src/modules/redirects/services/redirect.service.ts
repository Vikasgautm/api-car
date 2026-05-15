import { v4 as uuidv4 } from 'uuid';
import { IRedirect, Redirect } from '../../../models/redirect.model';
import { AppError } from '../../../shared/utils/app-error.util';
import { AuditActor, AuditUtil } from '../../../shared/utils/audit.util';
import { FilterUtil } from '../../../shared/utils/filter.util';
import { PaginationUtil } from '../../../shared/utils/pagination.util';

function normalizePath(input: string): string {
  if (!input) return input;
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return trimmed;
  // Collapse trailing slash (except root) so /foo and /foo/ resolve to the same row.
  if (trimmed.length > 1 && trimmed.endsWith('/')) return trimmed.slice(0, -1);
  return trimmed;
}

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

export class RedirectService {
  /**
   * Resolve a URL through the redirect table, returning the final destination.
   * Walks at most `maxHops` rows so a chain (which we try to prevent on write)
   * still can't loop the request forever if one slips in.
   */
  static async resolve(url: string, maxHops = 3): Promise<{ new_url: string; type: '301' | '302'; redirect_id: string } | null> {
    const path = normalizePath(url);
    if (!path) return null;

    let current = path;
    let lastHit: { new_url: string; type: '301' | '302'; redirect_id: string } | null = null;
    for (let i = 0; i < maxHops; i++) {
      const row = await Redirect.findOne({ old_url: current, is_deleted: false }).lean();
      if (!row) break;
      lastHit = { new_url: row.new_url, type: row.type as '301' | '302', redirect_id: row.redirect_id };
      current = row.new_url;
    }
    return lastHit;
  }

  /** Fire-and-forget metrics update so resolution stays fast. */
  static recordHit(redirect_id: string): void {
    Redirect.updateOne(
      { redirect_id },
      { $inc: { hit_count: 1 }, $set: { last_hit_at: new Date() } }
    ).catch(() => { /* metrics are best-effort */ });
  }

  static async list(params: {
    page?: number;
    limit?: number;
    q?: string;
    is_deleted?: boolean | string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, limit = 25, q, is_deleted, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const filter: Record<string, unknown> = {};
    if (is_deleted === true || is_deleted === 'true') {
      filter.is_deleted = true;
    } else {
      filter.is_deleted = false;
    }
    if (q) {
      Object.assign(filter, FilterUtil.buildSearchFilter(['old_url', 'new_url', 'reason'], q));
    }

    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);
    const sortFilter = FilterUtil.buildSortFilter(sortBy, sortOrder);

    const [redirects, total] = await Promise.all([
      Redirect.find(filter).sort(sortFilter).skip(skip).limit(validatedLimit).lean(),
      Redirect.countDocuments(filter),
    ]);

    return {
      redirects,
      pagination: PaginationUtil.createPaginationMeta(page, validatedLimit, total),
    };
  }

  static async getById(redirect_id: string) {
    return Redirect.findOne({ redirect_id }).lean();
  }

  static async create(input: CreateRedirectInput, actor: AuditActor | null) {
    const old_url = normalizePath(input.old_url);
    const new_url = normalizePath(input.new_url);
    if (old_url === new_url) {
      throw new AppError('old_url and new_url must differ', 400);
    }

    // Reject if old_url is already a live row.
    const existing = await Redirect.findOne({ old_url, is_deleted: false }).lean();
    if (existing) {
      throw new AppError(
        `A redirect from "${old_url}" already exists (→ ${existing.new_url}). Update or delete it instead.`,
        409
      );
    }

    // Chain prevention: refuse if new_url is itself the old_url of another live row.
    const chainTarget = await Redirect.findOne({ old_url: new_url, is_deleted: false }).lean();
    if (chainTarget) {
      throw new AppError(
        `Refusing to create a redirect chain: "${new_url}" is already redirected to "${chainTarget.new_url}". Point old_url directly at the final destination.`,
        409
      );
    }

    // Loop prevention: if any live row points TO our old_url, accepting this row
    // would make that previous row a chain. Surface so the admin can flatten it.
    const inbound = await Redirect.findOne({ new_url: old_url, is_deleted: false }).lean();
    if (inbound) {
      throw new AppError(
        `Refusing to create — "${inbound.old_url}" already redirects to "${old_url}". Re-target that row to "${new_url}" instead so the chain stays flat.`,
        409
      );
    }

    const redirect_id = uuidv4();
    let created;
    try {
      created = await Redirect.create({
        redirect_id,
        old_url,
        new_url,
        type: input.type || '301',
        reason: input.reason || null,
        created_by: actor?.user_id ?? null,
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new AppError(`A redirect from "${old_url}" already exists.`, 409);
      }
      throw err;
    }

    await AuditUtil.recordEvent({
      entity_type: 'car',
      entity_id: redirect_id,
      action: 'create',
      field: 'redirect',
      new_value: { old_url, new_url, type: created.type, reason: created.reason },
      actor,
    });

    return created;
  }

  static async update(redirect_id: string, input: UpdateRedirectInput, actor: AuditActor | null) {
    const before = await Redirect.findOne({ redirect_id, is_deleted: false }).lean();
    if (!before) throw AppError.notFound('Redirect', 'redirect_id', redirect_id);

    const next = {
      old_url: input.old_url !== undefined ? normalizePath(input.old_url) : before.old_url,
      new_url: input.new_url !== undefined ? normalizePath(input.new_url) : before.new_url,
      type: input.type ?? before.type,
      reason: input.reason !== undefined ? input.reason : before.reason,
    };

    if (next.old_url === next.new_url) {
      throw new AppError('old_url and new_url must differ', 400);
    }

    // Re-validate chain rules if either URL changed.
    if (input.old_url !== undefined || input.new_url !== undefined) {
      const chainTarget = await Redirect.findOne({
        old_url: next.new_url,
        is_deleted: false,
        redirect_id: { $ne: redirect_id },
      }).lean();
      if (chainTarget) {
        throw new AppError(
          `Refusing to create a redirect chain: "${next.new_url}" already redirects to "${chainTarget.new_url}".`,
          409
        );
      }
      const inbound = await Redirect.findOne({
        new_url: next.old_url,
        is_deleted: false,
        redirect_id: { $ne: redirect_id },
      }).lean();
      if (inbound) {
        throw new AppError(
          `Refusing — "${inbound.old_url}" already redirects to "${next.old_url}".`,
          409
        );
      }
    }

    let updated;
    try {
      updated = await Redirect.findOneAndUpdate(
        { redirect_id, is_deleted: false },
        next,
        { returnDocument: 'after' }
      );
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new AppError(`A redirect from "${next.old_url}" already exists.`, 409);
      }
      throw err;
    }

    await AuditUtil.recordEvent({
      entity_type: 'car',
      entity_id: redirect_id,
      action: 'update',
      field: 'redirect',
      old_value: { old_url: before.old_url, new_url: before.new_url, type: before.type, reason: before.reason },
      new_value: next,
      actor,
    });

    return updated;
  }

  static async softDelete(redirect_id: string, actor: AuditActor | null) {
    const updated = await Redirect.findOneAndUpdate(
      { redirect_id, is_deleted: false },
      { is_deleted: true },
      { returnDocument: 'after' }
    );
    if (!updated) throw AppError.notFound('Redirect', 'redirect_id', redirect_id);

    await AuditUtil.recordEvent({
      entity_type: 'car',
      entity_id: redirect_id,
      action: 'delete',
      field: 'redirect',
      old_value: { old_url: updated.old_url, new_url: updated.new_url },
      actor,
    });

    return updated;
  }

  static async restore(redirect_id: string, actor: AuditActor | null) {
    const target = await Redirect.findOne({ redirect_id, is_deleted: true }).lean();
    if (!target) throw AppError.notFound('Redirect', 'redirect_id', redirect_id);

    // Make sure restoring doesn't resurrect a duplicate old_url.
    const clash = await Redirect.findOne({ old_url: target.old_url, is_deleted: false }).lean();
    if (clash) {
      throw new AppError(
        `Cannot restore — a live redirect from "${target.old_url}" already exists (→ ${clash.new_url}).`,
        409
      );
    }

    const updated = await Redirect.findOneAndUpdate(
      { redirect_id },
      { is_deleted: false },
      { returnDocument: 'after' }
    );

    await AuditUtil.recordEvent({
      entity_type: 'car',
      entity_id: redirect_id,
      action: 'restore',
      field: 'redirect',
      new_value: { old_url: updated?.old_url, new_url: updated?.new_url },
      actor,
    });

    return updated;
  }
}

export type { IRedirect };
