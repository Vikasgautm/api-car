"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuidIdParamSchema = exports.carIdParamSchema = exports.slugParamSchema = exports.idParamSchema = exports.commonFieldsSchema = exports.metaFieldsSchema = exports.userRoleSchema = exports.answerFormatSchema = exports.transmissionTypeSchema = exports.publishStatusSchema = exports.paginationSchema = exports.booleanStringSchema = exports.urlSchema = exports.emailSchema = exports.slugSchema = exports.uuidSchema = exports.objectIdSchema = void 0;
const zod_1 = require("zod");
// Common validation schemas
exports.objectIdSchema = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');
exports.uuidSchema = zod_1.z.string().uuid('Invalid UUID format');
exports.slugSchema = zod_1.z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens');
exports.emailSchema = zod_1.z.string().email('Invalid email format');
exports.urlSchema = zod_1.z.string().url('Invalid URL format');
exports.booleanStringSchema = zod_1.z.union([
    zod_1.z.boolean(),
    zod_1.z.enum(['true', 'false', '1', '0']).transform((val) => val === 'true' || val === '1'),
]);
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1).optional(),
    limit: zod_1.z.coerce.number().int().positive().max(1000).default(10).optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    q: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    is_deleted: exports.booleanStringSchema.optional(),
    is_published: exports.booleanStringSchema.optional(),
    is_featured: exports.booleanStringSchema.optional(),
});
exports.publishStatusSchema = zod_1.z.enum(['upcoming', 'on_sale', 'discontinued']).optional();
exports.transmissionTypeSchema = zod_1.z.enum(['manual', 'automatic', 'cvt', 'dct', 'amt']);
exports.answerFormatSchema = zod_1.z.enum(['text', 'html', 'markdown']);
exports.userRoleSchema = zod_1.z.enum(['super_admin', 'admin', 'editor', 'user']);
// Meta field schemas
exports.metaFieldsSchema = zod_1.z.object({
    meta_title: zod_1.z.string().max(100).optional(),
    meta_description: zod_1.z.string().max(160).optional(),
    meta_keywords: zod_1.z.string().max(500).optional(),
    og_image: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    canonical_url: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    noindex: zod_1.z.boolean().optional(),
}).strict();
// Common field schemas
exports.commonFieldsSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    description: zod_1.z.string().max(2000).optional(),
    is_published: zod_1.z.boolean().optional(),
    is_featured: zod_1.z.boolean().optional(),
});
// ID params schema
exports.idParamSchema = zod_1.z.object({
    id: exports.objectIdSchema,
});
// Slug param schema
exports.slugParamSchema = zod_1.z.object({
    slug: exports.slugSchema,
});
// Car ID param schema (uses UUID for car_id)
exports.carIdParamSchema = zod_1.z.object({
    carId: exports.uuidSchema,
});
// Generic ID param schema for entities using UUID
exports.uuidIdParamSchema = zod_1.z.object({
    id: exports.uuidSchema,
});
//# sourceMappingURL=common-validation.schemas.js.map