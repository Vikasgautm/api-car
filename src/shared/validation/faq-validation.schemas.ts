import { z } from 'zod';
import { answerFormatSchema, booleanStringSchema, uuidSchema } from './common-validation.schemas';

// FAQ DTO schemas
export const createFaqSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters'),
  answer: z.string().min(20, 'Answer must be at least 20 characters'),
  category: z.string().min(2, 'Category must be at least 2 characters'),
  order: z.number().int().nonnegative().optional(),
  tags: z.array(z.string().min(2)).max(20, 'Cannot have more than 20 tags').optional(),
  answer_format: answerFormatSchema.optional(),
  faq_group: z.string().min(2).optional(),
  related_cars: z.array(uuidSchema).optional(),
  related_brands: z.array(uuidSchema).optional(),
  related_blogs: z.array(uuidSchema).optional(),
  is_published: booleanStringSchema.optional(),
  is_featured: booleanStringSchema.optional(),
  faq_type: z.string().optional(),
  intent_type: z.string().optional(),
  entity_type: z.string().optional(),
  entity_id: uuidSchema.optional(),

  related_entities: z
    .array(
      z.union([
        z.object({
          entity_type: z.string(),
          entity_id: uuidSchema,
        }),
        uuidSchema,
      ])
    )
    .optional(),
  target_page_types: z.array(z.string()).optional(),

  template_key: z.string().optional(),

  is_dynamic: booleanStringSchema.optional(),
  is_editorial: booleanStringSchema.optional(),
  indexable: booleanStringSchema.optional(),
  schema_enabled: booleanStringSchema.optional(),
  needs_refresh: booleanStringSchema.optional(),

  canonical_intent_key: z.string().optional(),

  priority_score: z.number().optional(),

  visibility_status: z.string().optional(),
  source_type: z.string().optional(),

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
