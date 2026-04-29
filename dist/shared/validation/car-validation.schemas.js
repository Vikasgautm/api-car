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
    brand_id: common_validation_schemas_1.uuidSchema,
    body_type_id: common_validation_schemas_1.uuidSchema,
    fuel_type_id: common_validation_schemas_1.uuidSchema.optional(),
    short_description: zod_1.z.string().max(500).optional(),
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
}).extend(common_validation_schemas_1.metaFieldsSchema.shape).strict();
exports.updateCarSchema = exports.createCarSchema.partial().strict();
// Car Variant DTO schemas
exports.createVariantSchema = zod_1.z.object({
    car_id: common_validation_schemas_1.objectIdSchema,
    variant_name: zod_1.z.string().min(2, 'Variant name must be at least 2 characters'),
    model_year: zod_1.z.number().int().min(1900).max(2100, 'Model year must be between 1900 and 2100'),
    fuel_type_id: common_validation_schemas_1.objectIdSchema,
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
}).strict();
//# sourceMappingURL=car-validation.schemas.js.map