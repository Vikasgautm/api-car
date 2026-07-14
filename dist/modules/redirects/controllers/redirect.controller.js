"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedirectController = void 0;
const validation_1 = require("../../../shared/validation");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const redirect_service_1 = require("../services/redirect.service");
function actorFrom(req) {
    if (!req.user)
        return null;
    return { user_id: req.user.user_id, email: req.user.email, role: req.user.role };
}
class RedirectController {
    static list = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await redirect_service_1.RedirectService.list({
            page: req.query.page ? Number(req.query.page) : undefined,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
            q: req.query.q,
            is_deleted: req.query.is_deleted,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder,
        });
        return response_util_1.ResponseUtil.paginated(res, result.redirects, result.pagination, 'Redirects retrieved successfully');
    });
    static getById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const redirect = await redirect_service_1.RedirectService.getById(req.params.id);
        if (!redirect)
            throw app_error_util_1.AppError.notFound('Redirect', 'redirect_id', String(req.params.id ?? ''));
        return response_util_1.ResponseUtil.success(res, redirect, 'Redirect retrieved successfully');
    });
    static create = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const dto = {
            old_url: req.body.old_url,
            new_url: req.body.new_url,
            type: req.body.type,
            reason: req.body.reason,
        };
        const validation = validation_1.createRedirectSchema.safeParse(dto);
        if (!validation.success)
            throw new app_error_util_1.AppError(validation.error.issues.map((e) => e.message).join(', '), 400);
        const created = await redirect_service_1.RedirectService.create(dto, actorFrom(req));
        return response_util_1.ResponseUtil.created(res, created, 'Redirect created successfully');
    });
    static update = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const dto = {
            old_url: req.body.old_url,
            new_url: req.body.new_url,
            type: req.body.type,
            reason: req.body.reason,
        };
        const validation = validation_1.updateRedirectSchema.safeParse(dto);
        if (!validation.success)
            throw new app_error_util_1.AppError(validation.error.issues.map((e) => e.message).join(', '), 400);
        const updated = await redirect_service_1.RedirectService.update(req.params.id, dto, actorFrom(req));
        return response_util_1.ResponseUtil.success(res, updated, 'Redirect updated successfully');
    });
    static remove = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const updated = await redirect_service_1.RedirectService.softDelete(req.params.id, actorFrom(req));
        return response_util_1.ResponseUtil.success(res, updated, 'Redirect deleted successfully');
    });
    static restore = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const updated = await redirect_service_1.RedirectService.restore(req.params.id, actorFrom(req));
        return response_util_1.ResponseUtil.success(res, updated, 'Redirect restored successfully');
    });
    /** Public: resolve a path through the redirect table. Used by the frontend. */
    static resolvePublic = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const url = req.query.url || '';
        if (!url)
            throw new app_error_util_1.AppError('url query param is required', 400);
        const result = await redirect_service_1.RedirectService.resolve(url);
        if (!result)
            return response_util_1.ResponseUtil.success(res, { resolved: false }, 'No redirect');
        redirect_service_1.RedirectService.recordHit(result.redirect_id);
        return response_util_1.ResponseUtil.success(res, { resolved: true, ...result }, 'Redirect resolved');
    });
}
exports.RedirectController = RedirectController;
