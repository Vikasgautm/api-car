import { Response } from 'express';
import { AuthRequest } from '../../../types/auth';
import { AppError } from '../../../shared/utils/app-error.util';
import { AuditUtil } from '../../../shared/utils/audit.util';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { DeletionWorkflowService } from '../services/deletion-workflow.service';
import { CreateDeletionRequestDto, VerifyDeletionRequestDto } from '../../../shared/validation/deletion-workflow-validation.schemas';

function actorWithId(req: AuthRequest) {
  const actor = AuditUtil.actorFromRequest(req);
  if (!actor.user_id) {
    throw AppError.unauthorized('Missing user_id on request');
  }
  return { ...actor, user_id: actor.user_id };
}

export class DeletionWorkflowController {
  static create = catchAsync(async (req: AuthRequest, res: Response) => {
    const dto = CreateDeletionRequestDto.parse(req.body);

    const result = await DeletionWorkflowService.create(dto, actorWithId(req));
    return ResponseUtil.created(res, result, 'Deletion request created — OTP dispatched');
  });

  static verify = catchAsync(async (req: AuthRequest, res: Response) => {
    const dto = VerifyDeletionRequestDto.parse(req.body);

    const result = await DeletionWorkflowService.verify(
      req.params.id as string,
      dto.otp,
      actorWithId(req)
    );
    return ResponseUtil.success(res, result, 'Deletion request approved and applied');
  });

  static cancel = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await DeletionWorkflowService.cancel(
      req.params.id as string,
      req.body.reason,
      actorWithId(req)
    );
    return ResponseUtil.success(res, result, 'Deletion request cancelled');
  });

  static list = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await DeletionWorkflowService.list({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      status: req.query.status as any,
      entity_id: req.query.entity_id ? String(req.query.entity_id) : undefined,
      actor: actorWithId(req),
    });
    return ResponseUtil.paginated(res, result.requests, result.pagination, 'Deletion requests retrieved');
  });
}
