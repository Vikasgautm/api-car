"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unifiedSaveSchema = exports.unifiedPreviewSchema = exports.variantSaveSchema = exports.variantPreviewSchema = exports.carSaveSchema = exports.carPreviewSchema = void 0;
const zod_1 = require("zod");
// URL validation
const urlSchema = zod_1.z.string().url('Invalid URL format');
const isSupportedImportUrl = (val) => val.includes('cardekho.com') || val.includes('carwale.com');
// Car preview request validation
exports.carPreviewSchema = zod_1.z.object({
    url: urlSchema.refine(isSupportedImportUrl, {
        message: 'Only cardekho.com and carwale.com URLs are supported',
    }),
});
// Car save request validation
exports.carSaveSchema = zod_1.z.object({
    url: urlSchema,
    mode: zod_1.z.enum(['create', 'update', 'merge']),
    car_id: zod_1.z.string().optional(),
    data: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Car name is required'),
        brand_id: zod_1.z.string().min(1, 'Brand ID is required'),
        body_type_id: zod_1.z.string().min(1, 'Body type ID is required'),
        slug: zod_1.z.string().min(1, 'Slug is required'),
        description: zod_1.z.string().optional(),
        exshowroom_price: zod_1.z.number().min(0).nullable().optional(),
        expected_exshowroom_price: zod_1.z.number().min(0).nullable().optional(),
        is_electric: zod_1.z.boolean(),
        is_published: zod_1.z.boolean(),
    }),
    unmatched_data: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
// Variant preview request validation
exports.variantPreviewSchema = zod_1.z.object({
    car_id: zod_1.z.string().min(1, 'Car ID is required'),
    urls: zod_1.z.array(urlSchema.refine(isSupportedImportUrl, {
        message: 'Only cardekho.com and carwale.com URLs are supported',
    })).min(1, 'At least one URL is required').max(20, 'Maximum 20 URLs allowed'),
});
// Variant save request validation
exports.variantSaveSchema = zod_1.z.object({
    car_id: zod_1.z.string().min(1, 'Car ID is required'),
    mode: zod_1.z.enum(['create', 'update', 'merge']),
    items: zod_1.z.array(zod_1.z.object({
        url: urlSchema,
        variant_id: zod_1.z.string().optional(),
        data: zod_1.z.object({
            name: zod_1.z.string().min(1, 'Variant name is required'),
            slug: zod_1.z.string().min(1, 'Slug is required'),
            ex_showroom_price: zod_1.z.number().min(0).nullable().optional(),
            expected_price: zod_1.z.number().min(0).nullable().optional(),
            model_year: zod_1.z.number().min(1900).max(2100),
            fuel_type_id: zod_1.z.string().nullable().optional(),
            transmission_type: zod_1.z.enum(['manual', 'automatic', 'cvt', 'dct', 'amt', 'dsg', 'imt', 'torque_converter', 'single_speed_ev', 'e_cvt']).nullable().optional(),
            specs_normalized: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
            is_published: zod_1.z.boolean(),
        }),
        unmatched_specs: zod_1.z.array(zod_1.z.object({
            section: zod_1.z.string(),
            source_label: zod_1.z.string(),
            source_value: zod_1.z.string(),
            suggested_slug: zod_1.z.string(),
            suggested_category: zod_1.z.string().optional(),
        })).optional(),
    })).min(1, 'At least one variant item is required'),
});
// ── Unified import schemas ──────────────────────────────────────────────────
const sourceSchema = zod_1.z.enum(['carwale', 'cardekho']);
const importSourceUrl = (source) => source === 'carwale' ? source.includes('carwale.com') : source.includes('cardekho.com');
exports.unifiedPreviewSchema = zod_1.z.object({
    source: sourceSchema,
    carUrl: zod_1.z.string().url().optional(),
    variantUrls: zod_1.z.array(zod_1.z.string().url()).optional(),
}).refine(d => d.carUrl || (d.variantUrls && d.variantUrls.length > 0), {
    message: 'At least one of carUrl or variantUrls is required',
});
const manualMappingSchema = zod_1.z.object({
    scrapedKey: zod_1.z.string().min(1),
    targetField: zod_1.z.string(),
    value: zod_1.z.any(),
    saveMapping: zod_1.z.boolean().default(false),
    section: zod_1.z.string().optional(),
});
const variantItemSchema = zod_1.z.object({
    mode: zod_1.z.enum(['create', 'update', 'merge']),
    car_id: zod_1.z.string().optional().default(''),
    variant_id: zod_1.z.string().optional(),
    sourceUrl: zod_1.z.string().optional(),
    variantName: zod_1.z.string().min(1),
    slug: zod_1.z.string().min(1),
    modelYear: zod_1.z.number().min(1900).max(2100),
    fuelTypeId: zod_1.z.string().optional(),
    transmissionType: zod_1.z.string().nullable().optional(),
    exShowroomPrice: zod_1.z.number().optional(),
    specsNormalized: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    specsRaw: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    manualMappings: zod_1.z.array(manualMappingSchema).default([]),
    ignoredKeys: zod_1.z.array(zod_1.z.string()).default([]),
});
exports.unifiedSaveSchema = zod_1.z.object({
    source: sourceSchema,
    carUrl: zod_1.z.string().url().optional(),
    variantUrls: zod_1.z.array(zod_1.z.string().url()).optional(),
    car: zod_1.z.object({
        mode: zod_1.z.enum(['create', 'update', 'merge']),
        car_id: zod_1.z.string().optional(),
        name: zod_1.z.string().min(1),
        brand_id: zod_1.z.string().min(1),
        body_type_id: zod_1.z.string().min(1),
        slug: zod_1.z.string().min(1),
        description: zod_1.z.string().optional(),
        exshowroom_price: zod_1.z.number().nullable().optional(),
        expected_exshowroom_price: zod_1.z.number().nullable().optional(),
        is_electric: zod_1.z.boolean(),
        is_published: zod_1.z.boolean(),
        manualMappings: zod_1.z.array(manualMappingSchema).default([]),
        ignoredKeys: zod_1.z.array(zod_1.z.string()).default([]),
    }).optional(),
    variants: zod_1.z.array(variantItemSchema).optional(),
}).refine(d => d.car || (d.variants && d.variants.length > 0), {
    message: 'At least one of car or variants payload is required',
});
//# sourceMappingURL=import.validation.js.map