import { z } from 'zod';
import { objectIdSchema, paginationSchema } from './common-validation.schemas';

// Image DTO schemas
export const createImageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  alt_text: z.string().max(200).optional(),
  caption: z.string().max(500).optional(),
  tags: z.array(z.string().min(2)).max(20).optional(),
  folder: z.string().optional(),
}).strict();

export const updateImageSchema = createImageSchema.partial().strict();

export const createCarImageSchema = z.object({
  car_id: objectIdSchema,
  url: z.string().url('Invalid image URL'),
  alt_text: z.string().max(200).optional(),
  caption: z.string().max(500).optional(),
  is_primary: z.boolean().optional(),
  is_published: z.boolean().optional(),
}).strict();

export const updateCarImageSchema = createCarImageSchema.partial().strict();

export const imageFilterSchema = paginationSchema.extend({
  folder: z.string().optional(),
  is_published: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
}).strict();
