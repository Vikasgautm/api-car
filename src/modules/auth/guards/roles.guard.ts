import { NextFunction, Request, Response } from 'express';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { AuthRequest } from '../../../types/auth';

export const rolesGuard = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      ResponseUtil.error(res, 'Authentication required', 401);
      return;
    }

    if (!allowedRoles.includes(authReq.user.role)) {
      ResponseUtil.error(res, 'Insufficient permissions', 403);
      return;
    }

    next();
  };
};

export const adminGuard = rolesGuard(['super_admin', 'admin']);
export const editorGuard = rolesGuard(['super_admin', 'admin', 'editor']);
