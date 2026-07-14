"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifecycleGovernanceController = void 0;
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const audit_util_1 = require("../../../shared/utils/audit.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const lifecycle_governance_service_1 = require("../services/lifecycle-governance.service");
function actorWithId(req) {
    const actor = audit_util_1.AuditUtil.actorFromRequest(req);
    if (!actor.user_id)
        throw app_error_util_1.AppError.unauthorized('Missing user_id on request');
    return { ...actor, user_id: actor.user_id };
}
class LifecycleGovernanceController {
    static createRequest = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { car_id, to_state, reason, is_override, override_reason, acknowledged_warning } = req.body;
        if (!car_id)
            throw new app_error_util_1.AppError('car_id is required', 400);
        if (!to_state)
            throw new app_error_util_1.AppError('to_state is required', 400);
        if (!acknowledged_warning) {
            throw new app_error_util_1.AppError('You must acknowledge the lifecycle change warning (acknowledged_warning: true).', 400);
        }
        const result = await lifecycle_governance_service_1.LifecycleGovernanceService.createRequest({ car_id, to_state, reason, is_override: !!is_override, override_reason, acknowledged_warning: true }, actorWithId(req));
        return response_util_1.ResponseUtil.created(res, result, 'Lifecycle request created');
    });
    static approveRequest = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await lifecycle_governance_service_1.LifecycleGovernanceService.approveRequest(String(req.params.id), actorWithId(req));
        return response_util_1.ResponseUtil.success(res, result, 'Lifecycle request approved');
    });
    static verifyOTP = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { otp } = req.body;
        if (!otp)
            throw new app_error_util_1.AppError('otp is required', 400);
        const result = await lifecycle_governance_service_1.LifecycleGovernanceService.verifyOTP(String(req.params.id), otp, actorWithId(req));
        return response_util_1.ResponseUtil.success(res, result, 'OTP verified — lifecycle transition applied');
    });
    static rejectRequest = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await lifecycle_governance_service_1.LifecycleGovernanceService.rejectRequest(String(req.params.id), req.body.rejection_reason, actorWithId(req));
        return response_util_1.ResponseUtil.success(res, result, 'Lifecycle request rejected');
    });
    static cancelRequest = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await lifecycle_governance_service_1.LifecycleGovernanceService.cancelRequest(String(req.params.id), req.body.cancellation_reason, actorWithId(req));
        return response_util_1.ResponseUtil.success(res, result, 'Lifecycle request cancelled');
    });
    static listRequests = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await lifecycle_governance_service_1.LifecycleGovernanceService.listRequests({
            page: req.query.page ? Number(req.query.page) : undefined,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
            status: req.query.status,
            car_id: req.query.car_id ? String(req.query.car_id) : undefined,
            actor: actorWithId(req),
        });
        return response_util_1.ResponseUtil.paginated(res, result.requests, result.pagination, 'Lifecycle requests retrieved');
    });
    static getPendingForCar = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const pending = await lifecycle_governance_service_1.LifecycleGovernanceService.getPendingForCar(String(req.params.car_id));
        return response_util_1.ResponseUtil.success(res, pending ?? null, 'Pending lifecycle request retrieved');
    });
}
exports.LifecycleGovernanceController = LifecycleGovernanceController;
