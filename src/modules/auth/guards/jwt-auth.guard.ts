import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../../config';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { AuthRequest, JwtPayload } from '../../../types/auth';

export const jwtAuthGuard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ResponseUtil.error(res, 'Access token is required', 401);
      return;
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, config.jwt_secret) as JwtPayload;

    (req as AuthRequest).user = decoded;
    next();
  } catch (error) {
    ResponseUtil.error(res, 'Invalid or expired token', 401);
  }
};
