import { z } from 'zod';

// URL validation
const urlSchema = z.string().url('Invalid URL format');

const isSupportedImportUrl = (val: string) =>
  val.includes('cardekho.com') || val.includes('carwale.com');

// Car preview request validation
export const carPreviewSchema = z.object({
  url: urlSchema.refine(isSupportedImportUrl, {
    message: 'Only cardekho.com and carwale.com URLs are supported',
  }),
});

// Car save request validation
export const carSaveSchema = z.object({
  url: urlSchema,
  mode: z.enum(['create', 'update', 'merge']),
  car_id: z.string().optional(),
  data: z.object({
    name: z.string().min(1, 'Car name is required'),
    brand_id: z.string().min(1, 'Brand ID is required'),
    body_type_id: z.string().min(1, 'Body type ID is required'),
    slug: z.string().min(1, 'Slug is required'),
    description: z.string().optional(),
    exshowroom_price: z.number().min(0).nullable().optional(),
    expected_exshowroom_price: z.number().min(0).nullable().optional(),
    is_electric: z.boolean(),
    is_published: z.boolean(),
  }),
  unmatched_data: z.record(z.string(), z.any()).optional(),
});

// Variant preview request validation
export const variantPreviewSchema = z.object({
  car_id: z.string().min(1, 'Car ID is required'),
  urls: z.array(urlSchema.refine(isSupportedImportUrl, {
    message: 'Only cardekho.com and carwale.com URLs are supported',
  })).min(1, 'At least one URL is required').max(20, 'Maximum 20 URLs allowed'),
});

// Variant save request validation
export const variantSaveSchema = z.object({
  car_id: z.string().min(1, 'Car ID is required'),
  mode: z.enum(['create', 'update', 'merge']),
  items: z.array(z.object({
    url: urlSchema,
    variant_id: z.string().optional(),
    data: z.object({
      name: z.string().min(1, 'Variant name is required'),
      slug: z.string().min(1, 'Slug is required'),
      ex_showroom_price: z.number().min(0).nullable().optional(),
      expected_price: z.number().min(0).nullable().optional(),
      model_year: z.number().min(1900).max(2100),
      fuel_type_id: z.string().nullable().optional(),
      transmission_type: z.enum(['manual', 'automatic', 'cvt', 'dct', 'amt', 'dsg', 'imt', 'torque_converter', 'single_speed_ev', 'e_cvt']).nullable().optional(),
      specs_normalized: z.record(z.string(), z.any()).optional(),
      is_published: z.boolean(),
    }),
    unmatched_specs: z.array(z.object({
      section: z.string(),
      source_label: z.string(),
      source_value: z.string(),
      suggested_slug: z.string(),
      suggested_category: z.string().optional(),
    })).optional(),
  })).min(1, 'At least one variant item is required'),
});

export type CarPreviewInput = z.infer<typeof carPreviewSchema>;
export type CarSaveInput = z.infer<typeof carSaveSchema>;
export type VariantPreviewInput = z.infer<typeof variantPreviewSchema>;
export type VariantSaveInput = z.infer<typeof variantSaveSchema>;

// ── Unified import schemas ──────────────────────────────────────────────────

const sourceSchema = z.enum(['carwale', 'cardekho']);

const importSourceUrl = (source: string) =>
  source === 'carwale' ? source.includes('carwale.com') : source.includes('cardekho.com');

export const unifiedPreviewSchema = z.object({
  source: sourceSchema,
  carUrl: z.string().url().optional(),
  variantUrls: z.array(z.string().url()).optional(),
}).refine(d => d.carUrl || (d.variantUrls && d.variantUrls.length > 0), {
  message: 'At least one of carUrl or variantUrls is required',
});

const manualMappingSchema = z.object({
  scrapedKey: z.string().min(1),
  targetField: z.string(),
  value: z.any(),
  saveMapping: z.boolean().default(false),
  section: z.string().optional(),
});

const variantItemSchema = z.object({
  mode: z.enum(['create', 'update', 'merge']),
  car_id: z.string().optional().default(''),
  variant_id: z.string().optional(),
  sourceUrl: z.string().optional(),
  variantName: z.string().min(1),
  slug: z.string().min(1),
  modelYear: z.number().min(1900).max(2100),
  fuelTypeId: z.string().optional(),
  transmissionType: z.string().nullable().optional(),
  exShowroomPrice: z.number().optional(),
  specsNormalized: z.record(z.string(), z.any()).optional(),
  specsRaw: z.record(z.string(), z.any()).optional(),
  manualMappings: z.array(manualMappingSchema).default([]),
  ignoredKeys: z.array(z.string()).default([]),
});

export const unifiedSaveSchema = z.object({
  source: sourceSchema,
  carUrl: z.string().url().optional(),
  variantUrls: z.array(z.string().url()).optional(),
  car: z.object({
    mode: z.enum(['create', 'update', 'merge']),
    car_id: z.string().optional(),
    name: z.string().min(1),
    brand_id: z.string().min(1),
    body_type_id: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    exshowroom_price: z.number().nullable().optional(),
    expected_exshowroom_price: z.number().nullable().optional(),
    is_electric: z.boolean(),
    is_published: z.boolean(),
    manualMappings: z.array(manualMappingSchema).default([]),
    ignoredKeys: z.array(z.string()).default([]),
  }).optional(),
  variants: z.array(variantItemSchema).optional(),
}).refine(d => d.car || (d.variants && d.variants.length > 0), {
  message: 'At least one of car or variants payload is required',
});

export type UnifiedPreviewInput = z.infer<typeof unifiedPreviewSchema>;
export type UnifiedSaveInput = z.infer<typeof unifiedSaveSchema>;
