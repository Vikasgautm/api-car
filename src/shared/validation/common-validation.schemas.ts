import { z } from 'zod';

// Common validation schemas
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens');

export const emailSchema = z.string().email('Invalid email format');

export const urlSchema = z.string().url('Invalid URL format');

export const booleanStringSchema = z.union([
  z.boolean(),
  z.enum(['true', 'false', '1', '0']).transform((val) => val === 'true' || val === '1'),
]);

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(1000).default(10).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  q: z.string().optional(),
  search: z.string().optional(),
  is_deleted: booleanStringSchema.optional(),
  is_published: booleanStringSchema.optional(),
  is_featured: booleanStringSchema.optional(),
});

export const publishStatusSchema = z.enum(['upcoming', 'launched', 'discontinued']).optional();

export const transmissionTypeSchema = z.enum(['manual', 'automatic', 'cvt', 'dct', 'amt']);

export const answerFormatSchema = z.enum(['text', 'html', 'markdown']);

export const userRoleSchema = z.enum(['super_admin', 'admin', 'editor', 'user']);

// Meta field schemas
export const metaFieldsSchema = z.object({
  meta_title: z.string().max(100).optional(),
  meta_description: z.string().max(160).optional(),
  meta_keywords: z.string().max(500).optional(),
  og_image: z.string().url().optional().or(z.literal('')),
  canonical_url: z.string().url().optional().or(z.literal('')),
  noindex: z.boolean().optional(),
}).strict();

// Common field schemas
export const commonFieldsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().max(8000).optional(),
  is_published: z.boolean().optional(),
  is_featured: z.boolean().optional(),
});

// ID params schema
export const idParamSchema = z.object({
  id: objectIdSchema,
});

// Slug param schema
export const slugParamSchema = z.object({
  slug: slugSchema,
});

// Car ID param schema (uses UUID for car_id)
export const carIdParamSchema = z.object({
  carId: uuidSchema,
});

// Generic ID param schema for entities using UUID
export const uuidIdParamSchema = z.object({
  id: uuidSchema,
});
