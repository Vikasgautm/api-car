import { z } from 'zod';
import { metaFieldsSchema, objectIdSchema, publishStatusSchema, transmissionTypeSchema, uuidSchema } from './common-validation.schemas';

// Helper for boolean fields that may come as strings from FormData
const booleanOrString = z.union([
  z.boolean(),
  z.enum(['true', 'false']).transform((v) => v === 'true'),
]);

// Car DTO schemas
export const createCarSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase letters, digits, and hyphens only').optional(),
  brand_id: uuidSchema,
  body_type_id: uuidSchema,
  fuel_type_id: uuidSchema.optional(),
  short_description: z.string().max(8000).optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  thumbnail_url: z.string().url().optional().or(z.literal('')),
  thumbnail_alt: z.string().max(200).optional(),
  gallery: z.array(z.object({
    url: z.string().url(),
    alt: z.string().optional(),
  })).optional(),
  gallery_summary: z.string().max(1000).optional(),
  status: publishStatusSchema.optional(),
  is_electric: booleanOrString.optional(),
  is_published: booleanOrString.optional(),
  is_featured: booleanOrString.optional(),
  is_upcoming: booleanOrString.optional(),
  is_popular: booleanOrString.optional(),
  is_recommended: booleanOrString.optional(),
  is_latest: booleanOrString.optional(),
  top_selling: booleanOrString.optional(),
  is_launched: booleanOrString.optional(),
  tag_ids: z.union([
    z.array(z.string()),
    z.string().transform((s) => s.split(',').map((v) => v.trim()).filter(Boolean)),
  ]).optional(),
  // Generation / lifecycle (manual model_family — Gap 1)
  model_family: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]*$/, 'model_family must be a slug-style token').nullable().optional(),
  generation_start_year: z.coerce.number().int().min(1900).max(2200).nullable().optional(),
  generation_end_year: z.coerce.number().int().min(1900).max(2200).nullable().optional(),
  generation_label: z.string().max(120).nullable().optional(),
  is_current: booleanOrString.optional(),
  is_facelift: booleanOrString.optional(),
  predecessor_car_id: uuidSchema.nullable().optional(),
  successor_car_id: uuidSchema.nullable().optional(),
  editor_user_id: z.string().nullable().optional(),
  seo_owner_user_id: z.string().nullable().optional(),
  reviewer_user_id: z.string().nullable().optional(),
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
  brand_id: uuidSchema.optional(),
  body_type_id: uuidSchema.optional(),
  status: publishStatusSchema.optional(),
  is_electric: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  is_published: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  is_featured: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  min_price: z.number().nonnegative().optional(),
  max_price: z.number().nonnegative().optional(),
  tag_ids: z.union([
    z.array(z.string()),
    z.string(),
  ]).optional(),
  tag_slugs: z.union([
    z.array(z.string()),
    z.string(),
  ]).optional(),
  mileage_class: z.union([
    z.array(z.enum(['weak', 'average', 'good', 'excellent'])),
    z.string(),
  ]).optional(),
  range_class: z.union([
    z.array(z.enum(['weak', 'average', 'good', 'excellent'])),
    z.string(),
  ]).optional(),
}).strict();
