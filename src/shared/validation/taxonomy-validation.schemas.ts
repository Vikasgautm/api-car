import { z } from 'zod';

const createTagCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.string().min(1, 'Type is required'),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional(),
  is_published: z.boolean().optional(),
  sort_order: z.number().optional(),
}).strict();

const updateTagCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  type: z.string().min(1, 'Type is required').optional(),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional(),
  is_published: z.boolean().optional(),
  sort_order: z.number().optional(),
}).strict();

const createTagSchema = z.object({
  tag_category_id: z.string().min(1, 'Category is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional(),
  seo_meta: z.object({
    title: z.string().optional(),
    description: z.string().max(160, 'SEO meta description cannot exceed 160 characters').optional(),
    h1: z.string().optional(),
  }).optional(),
  is_published: z.boolean().optional(),
  sort_order: z.number().optional(),
}).strict();

const updateTagSchema = z.object({
  tag_category_id: z.string().min(1, 'Category is required').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional(),
  seo_meta: z.object({
    title: z.string().optional(),
    description: z.string().max(160, 'SEO meta description cannot exceed 160 characters').optional(),
    h1: z.string().optional(),
  }).optional(),
  is_published: z.boolean().optional(),
  sort_order: z.number().optional(),
}).strict();

export class CreateTagCategoryDto {
  name!: string;
  type!: string;
  description?: string;
  is_published?: boolean;
  sort_order?: number;

  static validate(dto: any) {
    const res = createTagCategorySchema.safeParse(dto);
    return res;
  }
}

export class UpdateTagCategoryDto {
  name?: string;
  type?: string;
  description?: string;
  is_published?: boolean;
  sort_order?: number;

  static validate(dto: any) {
    const res = updateTagCategorySchema.safeParse(dto);
    return res;
  }
}

export class CreateTagDto {
  tag_category_id!: string;
  name!: string;
  description?: string;
  seo_meta?: {
    title?: string;
    description?: string;
    h1?: string;
  };
  is_published?: boolean;
  sort_order?: number;

  static validate(dto: any) {
    const res = createTagSchema.safeParse(dto);
    return res;
  }
}

export class UpdateTagDto {
  tag_category_id?: string;
  name?: string;
  description?: string;
  seo_meta?: {
    title?: string;
    description?: string;
    h1?: string;
  };
  is_published?: boolean;
  sort_order?: number;

  static validate(dto: any) {
    const res = updateTagSchema.safeParse(dto);
    return res;
  }
}
