"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeletionWorkflowController = void 0;
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const audit_util_1 = require("../../../shared/utils/audit.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const deletion_workflow_service_1 = require("../services/deletion-workflow.service");
const deletion_workflow_validation_schemas_1 = require("../../../shared/validation/deletion-workflow-validation.schemas");
function actorWithId(req) {
    const actor = audit_util_1.AuditUtil.actorFromRequest(req);
    if (!actor.user_id) {
        throw app_error_util_1.AppError.unauthorized('Missing user_id on request');
    }
    return { ...actor, user_id: actor.user_id };
}
class DeletionWorkflowController {
    static create = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const dto = deletion_workflow_validation_schemas_1.CreateDeletionRequestDto.parse(req.body);
        const result = await deletion_workflow_service_1.DeletionWorkflowService.create(dto, actorWithId(req));
        return response_util_1.ResponseUtil.created(res, result, 'Deletion request created — OTP dispatched');
    });
    static verify = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const dto = deletion_workflow_validation_schemas_1.VerifyDeletionRequestDto.parse(req.body);
        const result = await deletion_workflow_service_1.DeletionWorkflowService.verify(req.params.id, dto.otp, actorWithId(req));
        return response_util_1.ResponseUtil.success(res, result, 'Deletion request approved and applied');
    });
    static cancel = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await deletion_workflow_service_1.DeletionWorkflowService.cancel(req.params.id, req.body.reason, actorWithId(req));
        return response_util_1.ResponseUtil.success(res, result, 'Deletion request cancelled');
    });
    static list = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await deletion_workflow_service_1.DeletionWorkflowService.list({
            page: req.query.page ? Number(req.query.page) : undefined,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
            status: req.query.status,
            entity_id: req.query.entity_id ? String(req.query.entity_id) : undefined,
            actor: actorWithId(req),
        });
        return response_util_1.ResponseUtil.paginated(res, result.requests, result.pagination, 'Deletion requests retrieved');
    });
}
exports.DeletionWorkflowController = DeletionWorkflowController;
