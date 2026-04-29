"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.variantSaveSchema = exports.variantPreviewSchema = exports.carSaveSchema = exports.carPreviewSchema = void 0;
const zod_1 = require("zod");
// URL validation
const urlSchema = zod_1.z.string().url('Invalid URL format');
// Car preview request validation
exports.carPreviewSchema = zod_1.z.object({
    url: urlSchema.refine((val) => val.includes('cardekho.com'), {
        message: 'Only cardekho.com URLs are supported',
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
    urls: zod_1.z.array(urlSchema.refine((val) => val.includes('cardekho.com'), {
        message: 'Only cardekho.com URLs are supported',
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
            transmission_type: zod_1.z.enum(['manual', 'automatic', 'cvt', 'dct', 'amt']).nullable().optional(),
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
//# sourceMappingURL=import.validation.js.map