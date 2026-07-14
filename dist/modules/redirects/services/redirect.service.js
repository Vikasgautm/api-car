"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedirectService = void 0;
const uuid_1 = require("uuid");
const redirect_model_1 = require("../../../models/redirect.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const audit_util_1 = require("../../../shared/utils/audit.util");
const filter_util_1 = require("../../../shared/utils/filter.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
function normalizePath(input) {
    if (!input)
        return input;
    const trimmed = input.trim();
    if (!trimmed.startsWith('/'))
        return trimmed;
    // Collapse trailing slash (except root) so /foo and /foo/ resolve to the same row.
    if (trimmed.length > 1 && trimmed.endsWith('/'))
        return trimmed.slice(0, -1);
    return trimmed;
}
class RedirectService {
    /**
     * Resolve a URL through the redirect table, returning the final destination.
     * Walks at most `maxHops` rows so a chain (which we try to prevent on write)
     * still can't loop the request forever if one slips in.
     */
    static async resolve(url, maxHops = 3) {
        const path = normalizePath(url);
        if (!path)
            return null;
        let current = path;
        let lastHit = null;
        for (let i = 0; i < maxHops; i++) {
            const row = await redirect_model_1.Redirect.findOne({ old_url: current, is_deleted: false }).lean();
            if (!row)
                break;
            lastHit = { new_url: row.new_url, type: row.type, redirect_id: row.redirect_id };
            current = row.new_url;
        }
        return lastHit;
    }
    /** Fire-and-forget metrics update so resolution stays fast. */
    static recordHit(redirect_id) {
        redirect_model_1.Redirect.updateOne({ redirect_id }, { $inc: { hit_count: 1 }, $set: { last_hit_at: new Date() } }).catch(() => { });
    }
    static async list(params) {
        const { page = 1, limit = 25, q, is_deleted, sortBy = 'createdAt', sortOrder = 'desc' } = params;
        const filter = {};
        if (is_deleted === true || is_deleted === 'true') {
            filter.is_deleted = true;
        }
        else {
            filter.is_deleted = false;
        }
        if (q) {
            Object.assign(filter, filter_util_1.FilterUtil.buildSearchFilter(['old_url', 'new_url', 'reason'], q));
        }
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const sortFilter = filter_util_1.FilterUtil.buildSortFilter(sortBy, sortOrder);
        const [redirects, total] = await Promise.all([
            redirect_model_1.Redirect.find(filter).sort(sortFilter).skip(skip).limit(validatedLimit).lean(),
            redirect_model_1.Redirect.countDocuments(filter),
        ]);
        return {
            redirects,
            pagination: pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total),
        };
    }
    static async getById(redirect_id) {
        return redirect_model_1.Redirect.findOne({ redirect_id }).lean();
    }
    static async create(input, actor) {
        const old_url = normalizePath(input.old_url);
        const new_url = normalizePath(input.new_url);
        if (old_url === new_url) {
            throw new app_error_util_1.AppError('old_url and new_url must differ', 400);
        }
        // Reject if old_url is already a live row.
        const existing = await redirect_model_1.Redirect.findOne({ old_url, is_deleted: false }).lean();
        if (existing) {
            throw new app_error_util_1.AppError(`A redirect from "${old_url}" already exists (→ ${existing.new_url}). Update or delete it instead.`, 409);
        }
        // Chain prevention: refuse if new_url is itself the old_url of another live row.
        const chainTarget = await redirect_model_1.Redirect.findOne({ old_url: new_url, is_deleted: false }).lean();
        if (chainTarget) {
            throw new app_error_util_1.AppError(`Refusing to create a redirect chain: "${new_url}" is already redirected to "${chainTarget.new_url}". Point old_url directly at the final destination.`, 409);
        }
        // Loop prevention: if any live row points TO our old_url, accepting this row
        // would make that previous row a chain. Surface so the admin can flatten it.
        const inbound = await redirect_model_1.Redirect.findOne({ new_url: old_url, is_deleted: false }).lean();
        if (inbound) {
            throw new app_error_util_1.AppError(`Refusing to create — "${inbound.old_url}" already redirects to "${old_url}". Re-target that row to "${new_url}" instead so the chain stays flat.`, 409);
        }
        const redirect_id = (0, uuid_1.v4)();
        let created;
        try {
            created = await redirect_model_1.Redirect.create({
                redirect_id,
                old_url,
                new_url,
                type: input.type || '301',
                reason: input.reason || null,
                created_by: actor?.user_id ?? null,
            });
        }
        catch (err) {
            if (err?.code === 11000) {
                throw new app_error_util_1.AppError(`A redirect from "${old_url}" already exists.`, 409);
            }
            throw err;
        }
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'car',
            entity_id: redirect_id,
            action: 'create',
            field: 'redirect',
            new_value: { old_url, new_url, type: created.type, reason: created.reason },
            actor,
        });
        return created;
    }
    static async update(redirect_id, input, actor) {
        const before = await redirect_model_1.Redirect.findOne({ redirect_id, is_deleted: false }).lean();
        if (!before)
            throw app_error_util_1.AppError.notFound('Redirect', 'redirect_id', redirect_id);
        const next = {
            old_url: input.old_url !== undefined ? normalizePath(input.old_url) : before.old_url,
            new_url: input.new_url !== undefined ? normalizePath(input.new_url) : before.new_url,
            type: input.type ?? before.type,
            reason: input.reason !== undefined ? input.reason : before.reason,
        };
        if (next.old_url === next.new_url) {
            throw new app_error_util_1.AppError('old_url and new_url must differ', 400);
        }
        // Re-validate chain rules if either URL changed.
        if (input.old_url !== undefined || input.new_url !== undefined) {
            const chainTarget = await redirect_model_1.Redirect.findOne({
                old_url: next.new_url,
                is_deleted: false,
                redirect_id: { $ne: redirect_id },
            }).lean();
            if (chainTarget) {
                throw new app_error_util_1.AppError(`Refusing to create a redirect chain: "${next.new_url}" already redirects to "${chainTarget.new_url}".`, 409);
            }
            const inbound = await redirect_model_1.Redirect.findOne({
                new_url: next.old_url,
                is_deleted: false,
                redirect_id: { $ne: redirect_id },
            }).lean();
            if (inbound) {
                throw new app_error_util_1.AppError(`Refusing — "${inbound.old_url}" already redirects to "${next.old_url}".`, 409);
            }
        }
        let updated;
        try {
            updated = await redirect_model_1.Redirect.findOneAndUpdate({ redirect_id, is_deleted: false }, next, { returnDocument: 'after' });
        }
        catch (err) {
            if (err?.code === 11000) {
                throw new app_error_util_1.AppError(`A redirect from "${next.old_url}" already exists.`, 409);
            }
            throw err;
        }
        await audit_util_1.AuditUtil.recordEvent({
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
    static async softDelete(redirect_id, actor) {
        const updated = await redirect_model_1.Redirect.findOneAndUpdate({ redirect_id, is_deleted: false }, { is_deleted: true }, { returnDocument: 'after' });
        if (!updated)
            throw app_error_util_1.AppError.notFound('Redirect', 'redirect_id', redirect_id);
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'car',
            entity_id: redirect_id,
            action: 'delete',
            field: 'redirect',
            old_value: { old_url: updated.old_url, new_url: updated.new_url },
            actor,
        });
        return updated;
    }
    static async restore(redirect_id, actor) {
        const target = await redirect_model_1.Redirect.findOne({ redirect_id, is_deleted: true }).lean();
        if (!target)
            throw app_error_util_1.AppError.notFound('Redirect', 'redirect_id', redirect_id);
        // Make sure restoring doesn't resurrect a duplicate old_url.
        const clash = await redirect_model_1.Redirect.findOne({ old_url: target.old_url, is_deleted: false }).lean();
        if (clash) {
            throw new app_error_util_1.AppError(`Cannot restore — a live redirect from "${target.old_url}" already exists (→ ${clash.new_url}).`, 409);
        }
        const updated = await redirect_model_1.Redirect.findOneAndUpdate({ redirect_id }, { is_deleted: false }, { returnDocument: 'after' });
        await audit_util_1.AuditUtil.recordEvent({
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
exports.RedirectService = RedirectService;
