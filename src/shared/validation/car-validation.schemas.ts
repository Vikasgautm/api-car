import { z } from 'zod';
import { metaFieldsSchema, objectIdSchema, publishStatusSchema, transmissionTypeSchema } from './common-validation.schemas';

// Car DTO schemas
export const createCarSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  brand_id: objectIdSchema,
  body_type_id: objectIdSchema,
  fuel_type_id: objectIdSchema.optional(),
  short_description: z.string().max(500).optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  thumbnail_url: z.string().url().optional().or(z.literal('')),
  thumbnail_alt: z.string().max(200).optional(),
  gallery: z.array(z.object({
    url: z.string().url(),
    alt: z.string().optional(),
  })).optional(),
  gallery_summary: z.string().max(1000).optional(),
  status: publishStatusSchema.optional(),
  is_electric: z.boolean().optional(),
  is_published: z.boolean().optional(),
  is_featured: z.boolean().optional(),
}).extend(metaFieldsSchema.shape).strict();

export const updateCarSchema = createCarSchema.partial().strict();

// Car Variant DTO schemas
export const createVariantSchema = z.object({
  car_id: objectIdSchema,
  variant_name: z.string().min(2, 'Variant name must be at least 2 characters'),
  model_year: z.number().int().min(1900).max(2100, 'Model year must be between 1900 and 2100'),
  fuel_type_id: objectIdSchema,
  transmission_type: transmissionTypeSchema,
  drivetrain: z.string().optional(),
  seating_capacity: z.number().int().min(2).max(10).optional(),
  ex_showroom_price: z.number().nonnegative().optional(),
  expected_price: z.number().nonnegative().optional(),
  expected_launch_date: z.coerce.date().optional(),
  is_published: z.boolean().optional(),
}).strict();

export const updateVariantSchema = createVariantSchema.partial().strict();

export const carFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  q: z.string().optional(),
  brand_id: objectIdSchema.optional(),
  body_type_id: objectIdSchema.optional(),
  status: publishStatusSchema.optional(),
  is_electric: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  is_published: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  is_featured: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  min_price: z.number().nonnegative().optional(),
  max_price: z.number().nonnegative().optional(),
}).strict();
