import { z } from 'zod';

const carIdSchema = z.string().min(24, 'Invalid car ID').max(40, 'Invalid car ID');

const ComparisonBaseSchema = z.object({
  car1_id: carIdSchema,
  car2_id: carIdSchema,
  variant1_id: z.string().optional(),
  variant2_id: z.string().optional(),
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters'),
  category: z.enum(['suv', 'sedan', 'hatchback', 'coupe', 'mpv', 'ev', 'luxury', 'budget', 'mid_range'] as const).optional(),
  description: z.string().optional(),
  compareIntroContent: z.string().optional(),
  isPopular: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  showOnHomepage: z.boolean().default(false),
  relatedComparisons: z.array(z.string()).optional(),
  seoMetaTitle: z.string().optional(),
  seoMetaDescription: z.string().optional(),
  seoFAQSchema: z.record(z.string(), z.any()).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  is_published: z.boolean().default(false),
});

export const CreateComparisonDTO = ComparisonBaseSchema.refine(
  (d) => d.car1_id !== d.car2_id,
  { message: 'Car 1 and Car 2 cannot be the same', path: ['car2_id'] },
);

export const UpdateComparisonDTO = ComparisonBaseSchema.partial();

const booleanFromQuery = z.preprocess(
  (val) => (val === 'false' ? false : val === 'true' ? true : val),
  z.boolean(),
);

export const ComparisonQueryDTO = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  isPopular: booleanFromQuery.optional(),
  isTrending: booleanFromQuery.optional(),
  is_deleted: booleanFromQuery.default(false),
});

export const CreateRivalDTO = z.object({
  primary_car_id: z.string().min(24, 'Invalid primary car ID'),
  rival_car_id: z.string().min(24, 'Invalid rival car ID'),
  relationship_strength: z.number().min(0).max(100).default(50),
});

export const GetRivalsDTO = z.object({
  car_id: z.string().min(24, 'Invalid car ID'),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export type CreateComparisonDTOType = z.infer<typeof CreateComparisonDTO>;
export type UpdateComparisonDTOType = z.infer<typeof UpdateComparisonDTO>;
export type ComparisonQueryDTOType = z.infer<typeof ComparisonQueryDTO>;
export type CreateRivalDTOType = z.infer<typeof CreateRivalDTO>;
export type GetRivalsDTOType = z.infer<typeof GetRivalsDTO>;

// Aliases matching standard naming
export const createComparisonSchema = CreateComparisonDTO;
export const updateComparisonSchema = UpdateComparisonDTO;
export const comparisonQuerySchema = ComparisonQueryDTO;
export const createRivalSchema = CreateRivalDTO;
export const getRivalsSchema = GetRivalsDTO;
