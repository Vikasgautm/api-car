"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bodyTypeFilterSchema = exports.updateBodyTypeSchema = exports.createBodyTypeSchema = void 0;
const zod_1 = require("zod");
const common_validation_schemas_1 = require("./common-validation.schemas");
// Body Type DTO schemas
exports.createBodyTypeSchema = common_validation_schemas_1.commonFieldsSchema
    .extend({
    description: zod_1.z.string().max(8000).optional().nullable(),
    seo_title: zod_1.z.string().max(500).optional().nullable(),
    meta_description: zod_1.z.string().max(2000).optional().nullable(),
    intro_content: zod_1.z.string().optional().nullable(),
    short_description: zod_1.z.string().optional().nullable(),
    logo_url: zod_1.z.string().optional().nullable(),
    logo_title: zod_1.z.string().optional().nullable(),
    hero_image_url: zod_1.z.string().optional().nullable(),
    hero_image_alt: zod_1.z.string().optional().nullable(),
    sort_order: zod_1.z.coerce.number().int().optional().nullable(),
    parent_id: zod_1.z.string().optional().nullable(),
    related_body_types: zod_1.z.array(zod_1.z.string()).optional().nullable(),
    created_by: zod_1.z.string().optional().nullable(),
    updated_by: zod_1.z.string().optional().nullable(),
})
    .extend(common_validation_schemas_1.metaFieldsSchema.shape)
    .passthrough();
exports.updateBodyTypeSchema = exports.createBodyTypeSchema.partial().passthrough();
exports.bodyTypeFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1).optional(),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10).optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    q: zod_1.z.string().optional(),
    is_published: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
    is_featured: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
}).strict();
