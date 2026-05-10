import { z } from 'zod';
import { commonFieldsSchema, metaFieldsSchema } from './common-validation.schemas';

// Body Type DTO schemas
export const createBodyTypeSchema = commonFieldsSchema
  .extend({
    description: z.string().max(8000).optional(),
  })
  .extend(metaFieldsSchema.shape)
  .strict();

export const updateBodyTypeSchema = createBodyTypeSchema.partial().strict();

export const bodyTypeFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  q: z.string().optional(),
  is_published: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  is_featured: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
}).strict();
