"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.brandFilterSchema = exports.updateBrandSchema = exports.createBrandSchema = void 0;
const zod_1 = require("zod");
const common_validation_schemas_1 = require("./common-validation.schemas");
// Brand DTO schemas
exports.createBrandSchema = common_validation_schemas_1.commonFieldsSchema
    .extend({
    logo_url: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    logo_title: zod_1.z.string().max(200).optional(),
})
    .extend(common_validation_schemas_1.metaFieldsSchema.shape)
    .strict();
exports.updateBrandSchema = common_validation_schemas_1.commonFieldsSchema
    .extend({
    logo_url: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    logo_title: zod_1.z.string().max(200).optional(),
})
    .extend(common_validation_schemas_1.metaFieldsSchema.shape)
    .partial()
    .strict();
exports.brandFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1).optional(),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10).optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    q: zod_1.z.string().optional(),
    is_published: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
    is_featured: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
}).strict();
//# sourceMappingURL=brand-validation.schemas.js.map