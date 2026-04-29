import { z } from 'zod';
import { objectIdSchema, answerFormatSchema } from './common-validation.schemas';

// FAQ DTO schemas
export const createFaqSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters'),
  answer: z.string().min(20, 'Answer must be at least 20 characters'),
  category: z.string().min(2, 'Category must be at least 2 characters'),
  order: z.number().int().nonnegative().optional(),
  tags: z.array(z.string().min(2)).max(20, 'Cannot have more than 20 tags').optional(),
  answer_format: answerFormatSchema.optional(),
  faq_group: z.string().min(2).optional(),
  related_cars: z.array(objectIdSchema).optional(),
  related_brands: z.array(objectIdSchema).optional(),
  related_blogs: z.array(objectIdSchema).optional(),
  is_published: z.boolean().optional(),
  is_featured: z.boolean().optional(),
}).strict();

export const updateFaqSchema = createFaqSchema.partial().strict();

export const faqFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  q: z.string().optional(),
  category: z.string().optional(),
  is_published: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  is_featured: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
}).strict();
