import { z } from 'zod';
import { metaFieldsSchema, objectIdSchema } from './common-validation.schemas';

// Blog DTO schemas
export const createBlogSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  excerpt: z.string().max(500).optional(),
  author_name: z.string().min(2).optional(),
  author_id: objectIdSchema.optional(),
  category: z.string().min(2, 'Category must be at least 2 characters'),
  tags: z.array(z.string().min(2)).max(20, 'Cannot have more than 20 tags').optional(),
  thumbnail_url: z.string().url().optional().or(z.literal('')),
  thumbnail_alt: z.string().max(200).optional(),
  images: z.array(z.object({
    url: z.string().url(),
    alt: z.string().optional(),
  })).optional(),
  link: z.string().url().optional().or(z.literal('')),
  is_published: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  noindex: z.boolean().optional(),
}).extend(metaFieldsSchema.shape).strict();

export const updateBlogSchema = createBlogSchema.partial().strict();

export const blogFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  q: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  is_published: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  is_featured: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  noindex: z.boolean().optional(),
}).strict();
