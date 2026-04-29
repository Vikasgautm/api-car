import { validateParams } from '../../middlewares/validate.middleware';
import { carIdParamSchema, idParamSchema, slugParamSchema, uuidIdParamSchema } from './common-validation.schemas';

// Reusable param validation middleware
export const validateIdParam = validateParams(idParamSchema);
export const validateSlugParam = validateParams(slugParamSchema);
export const validateCarIdParam = validateParams(carIdParamSchema);
export const validateUuidIdParam = validateParams(uuidIdParamSchema);
