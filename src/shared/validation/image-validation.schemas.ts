import { z } from 'zod';
import { paginationSchema } from './common-validation.schemas';
import {
  MAIN_CATEGORIES,
  ALL_SUBCATEGORIES,
  MEDIA_SCOPES,
  IMAGE_STATUSES,
} from '../services/media/media-constants';

// ─── Generic image schemas (unchanged) ───────────────────────────────────────

export const createImageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  alt_text: z.string().max(200).optional(),
  caption: z.string().max(500).optional(),
  tags: z.array(z.string().min(2)).max(20).optional(),
  folder: z.string().optional(),
}).strict();

export const updateImageSchema = createImageSchema.partial().strict();

// ─── Car image schemas ────────────────────────────────────────────────────────

export const createCarImageSchema = z.object({
  car_id: z.string().min(1),
  variant_id: z.string().optional(),

  main_category: z.enum(MAIN_CATEGORIES).optional(),
  sub_category: z.enum(ALL_SUBCATEGORIES as unknown as [string, ...string[]]).optional(),
  media_scope: z.enum(MEDIA_SCOPES).optional(),
  normalized_color: z.string().optional(),
  display_color_name: z.string().max(100).optional(),

  url: z.string().url('Invalid image URL').optional(),
  image_hash: z.string().optional(),

  image_title: z.string().max(200).optional(),
  alt_text: z.string().max(300).optional(),
  caption: z.string().max(500).optional(),
  tags: z.array(z.string()).max(20).optional(),
  source: z.string().optional(),

  status: z.enum(IMAGE_STATUSES).optional(),
  is_primary: z.boolean().optional(),
  is_published: z.boolean().optional(),

  sort_order: z.number().int().min(0).optional(),
  display_order: z.number().int().min(0).optional(),
});

export const updateCarImageSchema = createCarImageSchema.partial();

export const carImageFilterSchema = paginationSchema.extend({
  car_id: z.string().optional(),
  variant_id: z.string().optional(),
  main_category: z.enum(MAIN_CATEGORIES).optional(),
  sub_category: z.enum(ALL_SUBCATEGORIES as unknown as [string, ...string[]]).optional(),
  media_scope: z.enum(MEDIA_SCOPES).optional(),
  status: z.enum(IMAGE_STATUSES).optional(),
  is_primary: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  is_published: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  is_deleted: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
});

// ─── Bulk operation schemas ───────────────────────────────────────────────────

export const bulkStatusSchema = z.object({
  image_ids: z.array(z.string().min(1)).min(1).max(100),
  status: z.enum(IMAGE_STATUSES),
});

export const bulkCategorySchema = z.object({
  image_ids: z.array(z.string().min(1)).min(1).max(100),
  main_category: z.enum(MAIN_CATEGORIES),
  sub_category: z.enum(ALL_SUBCATEGORIES as unknown as [string, ...string[]]).optional(),
});

export const bulkDeleteSchema = z.object({
  image_ids: z.array(z.string().min(1)).min(1).max(100),
});

// ─── Legacy filter schema (kept for backward compat) ─────────────────────────

export const imageFilterSchema = paginationSchema.extend({
  folder: z.string().optional(),
  is_published: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
}).strict();
