"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.carFilterSchema = exports.updateVariantSchema = exports.createVariantSchema = exports.updateCarSchema = exports.createCarSchema = void 0;
const zod_1 = require("zod");
const common_validation_schemas_1 = require("./common-validation.schemas");
// Helper for boolean fields that may come as strings from FormData
const booleanOrString = zod_1.z.union([
    zod_1.z.boolean(),
    zod_1.z.enum(['true', 'false']).transform((v) => v === 'true'),
]);
// Car DTO schemas
exports.createCarSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    slug: zod_1.z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase letters, digits, and hyphens only').optional(),
    brand_id: common_validation_schemas_1.uuidSchema,
    body_type_id: common_validation_schemas_1.uuidSchema,
    fuel_type_id: common_validation_schemas_1.uuidSchema.optional(),
    short_description: zod_1.z.string().max(8000).optional(),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
    thumbnail_url: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    thumbnail_alt: zod_1.z.string().max(200).optional(),
    gallery: zod_1.z.array(zod_1.z.object({
        url: zod_1.z.string().url(),
        alt: zod_1.z.string().optional(),
    })).optional(),
    gallery_summary: zod_1.z.string().max(1000).optional(),
    status: common_validation_schemas_1.publishStatusSchema.optional(),
    is_electric: booleanOrString.optional(),
    is_published: booleanOrString.optional(),
    is_featured: booleanOrString.optional(),
    is_upcoming: booleanOrString.optional(),
    is_popular: booleanOrString.optional(),
    is_recommended: booleanOrString.optional(),
    is_latest: booleanOrString.optional(),
    top_selling: booleanOrString.optional(),
    is_launched: booleanOrString.optional(),
    tag_ids: zod_1.z.union([
        zod_1.z.array(zod_1.z.string()),
        zod_1.z.string().transform((s) => s.split(',').map((v) => v.trim()).filter(Boolean)),
    ]).optional(),
    // Generation / lifecycle (manual model_family — Gap 1)
    model_family: zod_1.z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]*$/, 'model_family must be a slug-style token').nullable().optional(),
    generation_start_year: zod_1.z.coerce.number().int().min(1900).max(2200).nullable().optional(),
    generation_end_year: zod_1.z.coerce.number().int().min(1900).max(2200).nullable().optional(),
    generation_label: zod_1.z.string().max(120).nullable().optional(),
    is_current: booleanOrString.optional(),
    is_facelift: booleanOrString.optional(),
    predecessor_car_id: common_validation_schemas_1.uuidSchema.nullable().optional(),
    successor_car_id: common_validation_schemas_1.uuidSchema.nullable().optional(),
    editor_user_id: zod_1.z.string().nullable().optional(),
    seo_owner_user_id: zod_1.z.string().nullable().optional(),
    reviewer_user_id: zod_1.z.string().nullable().optional(),
}).extend(common_validation_schemas_1.metaFieldsSchema.shape).strict();
exports.updateCarSchema = exports.createCarSchema.partial().strict();
// Car Variant DTO schemas
// NOTE: car_id / fuel_type_id / variant_id are UUID strings in this project,
// NOT Mongo ObjectIds. Keep these on uuidSchema to match the real payload shape.
exports.createVariantSchema = zod_1.z.object({
    car_id: common_validation_schemas_1.uuidSchema,
    variant_id: common_validation_schemas_1.uuidSchema.optional(),
    variant_name: zod_1.z.string().min(2, 'Variant name must be at least 2 characters'),
    model_year: zod_1.z.number().int().min(1900).max(2100, 'Model year must be between 1900 and 2100'),
    fuel_type_id: common_validation_schemas_1.uuidSchema,
    transmission_type: common_validation_schemas_1.transmissionTypeSchema,
    drivetrain: zod_1.z.string().optional(),
    seating_capacity: zod_1.z.number().int().min(2).max(10).optional(),
    ex_showroom_price: zod_1.z.number().nonnegative().optional(),
    expected_price: zod_1.z.number().nonnegative().optional(),
    expected_launch_date: zod_1.z.coerce.date().optional(),
    is_published: zod_1.z.boolean().optional(),
}).strict();
exports.updateVariantSchema = exports.createVariantSchema.partial().strict();
exports.carFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1).optional(),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10).optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    q: zod_1.z.string().optional(),
    brand_id: common_validation_schemas_1.uuidSchema.optional(),
    body_type_id: common_validation_schemas_1.uuidSchema.optional(),
    status: common_validation_schemas_1.publishStatusSchema.optional(),
    is_electric: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
    is_published: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
    is_featured: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
    min_price: zod_1.z.number().nonnegative().optional(),
    max_price: zod_1.z.number().nonnegative().optional(),
    tag_ids: zod_1.z.union([
        zod_1.z.array(zod_1.z.string()),
        zod_1.z.string(),
    ]).optional(),
    tag_slugs: zod_1.z.union([
        zod_1.z.array(zod_1.z.string()),
        zod_1.z.string(),
    ]).optional(),
    mileage_class: zod_1.z.union([
        zod_1.z.array(zod_1.z.enum(['weak', 'average', 'good', 'excellent'])),
        zod_1.z.string(),
    ]).optional(),
    range_class: zod_1.z.union([
        zod_1.z.array(zod_1.z.enum(['weak', 'average', 'good', 'excellent'])),
        zod_1.z.string(),
    ]).optional(),
}).strict();
