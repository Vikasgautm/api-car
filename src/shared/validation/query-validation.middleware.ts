import { Request, Response, NextFunction } from 'express';
import { validateQuery } from '../../middlewares/validate.middleware';
import { paginationSchema } from './common-validation.schemas';

// Reusable query validation middleware for pagination
export const validatePaginationQuery = validateQuery(paginationSchema);
