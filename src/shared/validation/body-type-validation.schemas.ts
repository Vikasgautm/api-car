import { z } from 'zod';
import { commonFieldsSchema, metaFieldsSchema } from './common-validation.schemas';

// Body Type DTO schemas
export const createBodyTypeSchema = commonFieldsSchema
  .extend({
    description: z.string().max(8000).optional().nullable(),
    seo_title: z.string().max(500).optional().nullable(),
    meta_description: z.string().max(2000).optional().nullable(),
    intro_content: z.string().optional().nullable(),
    short_description: z.string().optional().nullable(),
    logo_url: z.string().optional().nullable(),
    logo_title: z.string().optional().nullable(),
    hero_image_url: z.string().optional().nullable(),
    hero_image_alt: z.string().optional().nullable(),
    sort_order: z.coerce.number().int().optional().nullable(),
    parent_id: z.string().optional().nullable(),
    related_body_types: z.array(z.string()).optional().nullable(),
    created_by: z.string().optional().nullable(),
    updated_by: z.string().optional().nullable(),
  })
  .extend(metaFieldsSchema.shape)
  .passthrough();

export const updateBodyTypeSchema = createBodyTypeSchema.partial().passthrough();

export const bodyTypeFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  q: z.string().optional(),
  is_published: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  is_featured: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
}).strict();
