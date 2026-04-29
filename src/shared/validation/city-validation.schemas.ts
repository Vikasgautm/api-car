import { z } from 'zod';
import { slugSchema } from './common-validation.schemas';

// City DTO schemas
export const createCitySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: slugSchema.optional(),
  state: z.string().min(2, 'State must be at least 2 characters'),
  pincode: z.number().int().min(100000).max(999999, 'Pincode must be a 6-digit number').optional(),
  longitude: z.number().min(-180).max(180).optional(),
  latitude: z.number().min(-90).max(90).optional(),
}).strict();

export const updateCitySchema = createCitySchema.partial().strict();

export const cityFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  q: z.string().optional(),
  state: z.string().optional(),
}).strict();
