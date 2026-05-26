import { Response } from 'express';
import { AuthRequest } from '../../../types/auth';
import { AppError } from '../../../shared/utils/app-error.util';
import { AuditUtil } from '../../../shared/utils/audit.util';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { LifecycleGovernanceService } from '../services/lifecycle-governance.service';

function actorWithId(req: AuthRequest) {
  const actor = AuditUtil.actorFromRequest(req);
  if (!actor.user_id) throw AppError.unauthorized('Missing user_id on request');
  return { ...actor, user_id: actor.user_id };
}

export class LifecycleGovernanceController {
  static createRequest = catchAsync(async (req: AuthRequest, res: Response) => {
    const { car_id, to_state, reason, is_override, override_reason, acknowledged_warning } = req.body;

    if (!car_id) throw new AppError('car_id is required', 400);
    if (!to_state) throw new AppError('to_state is required', 400);
    if (!acknowledged_warning) {
      throw new AppError('You must acknowledge the lifecycle change warning (acknowledged_warning: true).', 400);
    }

    const result = await LifecycleGovernanceService.createRequest(
      { car_id, to_state, reason, is_override: !!is_override, override_reason, acknowledged_warning: true },
      actorWithId(req)
    );

    return ResponseUtil.created(res, result, 'Lifecycle request created');
  });

  static approveRequest = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await LifecycleGovernanceService.approveRequest(
      String(req.params.id),
      actorWithId(req)
    );
    return ResponseUtil.success(res, result, 'Lifecycle request approved');
  });

  static verifyOTP = catchAsync(async (req: AuthRequest, res: Response) => {
    const { otp } = req.body;
    if (!otp) throw new AppError('otp is required', 400);

    const result = await LifecycleGovernanceService.verifyOTP(
      String(req.params.id),
      otp,
      actorWithId(req)
    );
    return ResponseUtil.success(res, result, 'OTP verified — lifecycle transition applied');
  });

  static rejectRequest = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await LifecycleGovernanceService.rejectRequest(
      String(req.params.id),
      req.body.rejection_reason,
      actorWithId(req)
    );
    return ResponseUtil.success(res, result, 'Lifecycle request rejected');
  });

  static cancelRequest = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await LifecycleGovernanceService.cancelRequest(
      String(req.params.id),
      req.body.cancellation_reason,
      actorWithId(req)
    );
    return ResponseUtil.success(res, result, 'Lifecycle request cancelled');
  });

  static listRequests = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await LifecycleGovernanceService.listRequests({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      status: req.query.status as any,
      car_id: req.query.car_id ? String(req.query.car_id) : undefined,
      actor: actorWithId(req),
    });
    return ResponseUtil.paginated(res, result.requests, result.pagination, 'Lifecycle requests retrieved');
  });

  static getPendingForCar = catchAsync(async (req: AuthRequest, res: Response) => {
    const pending = await LifecycleGovernanceService.getPendingForCar(String(req.params.car_id));
    return ResponseUtil.success(res, pending ?? null, 'Pending lifecycle request retrieved');
  });
}
