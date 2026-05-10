import { NextFunction, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../models/user.model';
import { AppError } from '../shared/utils/app-error.util';
import { AuthRequest, JwtPayload } from '../types/auth';

export const protect: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Skip authentication in development mode
  // if (config.env === 'development') {
  //   return next();
  // }

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(AppError.unauthorized('You are not logged in! Please log in to get access.'));
  }

  try {
    const decoded = jwt.verify(token, config.jwt_secret) as JwtPayload;
    req.user = decoded;

    // Check if user still exists and is not deleted
    const currentUser = await User.findOne({
      user_id: decoded.user_id || decoded.id,
      is_deleted: false,
    });

    if (!currentUser) {
      return next(AppError.unauthorized('The user belonging to this token no longer exists or has been deleted.'));
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(AppError.tokenInvalid());
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(AppError.tokenExpired());
    }
    return next(AppError.unauthorized('Invalid token or expired. Please log in again.'));
  }
};

export const restrictTo = (...roles: string[]): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Skip role check in development mode
    // if (config.env === 'development') {
    //   return next();
    // }

    if (!req.user) {
      return next(new AppError('You are not logged in!', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

export const restrictToEditorOrAbove = (...roles: string[]): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('You are not logged in!', 401));
    }
    const allowedRoles = ['editor', 'admin', 'super_admin', ...roles];
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

export const optionalAuth: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt_secret) as JwtPayload;
      req.user = decoded;
    } catch (error) {
      // Ignore token errors for optional auth
    }
  }

  next();
};
