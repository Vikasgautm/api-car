import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { AppError } from '../shared/utils/app-error.util';

export const validate = (schema: ZodSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return next(AppError.validation('Validation failed', errors));
      }
      return next(error);
    }
  };
};

export const validateBody = (schema: ZodSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return next(AppError.validation('Request body validation failed', errors));
      }
      return next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.query);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return next(AppError.validation('Query parameters validation failed', errors));
      }
      return next(error);
    }
  };
};

export const validateParams = (schema: ZodSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.params);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return next(AppError.validation('URL parameters validation failed', errors));
      }
      return next(error);
    }
  };
};

export const validateOptional = (schema: ZodSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate: any = {};
      
      if (Object.keys(req.body).length > 0) {
        dataToValidate.body = req.body;
      }
      if (Object.keys(req.query).length > 0) {
        dataToValidate.query = req.query;
      }
      if (Object.keys(req.params).length > 0) {
        dataToValidate.params = req.params;
      }

      if (Object.keys(dataToValidate).length > 0) {
        await schema.parseAsync(dataToValidate);
      }
      
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return next(AppError.validation('Optional validation failed', errors));
      }
      return next(error);
    }
  };
};
