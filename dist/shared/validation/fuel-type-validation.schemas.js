"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fuelTypeFilterSchema = exports.updateFuelTypeSchema = exports.createFuelTypeSchema = void 0;
const zod_1 = require("zod");
const common_validation_schemas_1 = require("./common-validation.schemas");
// Fuel Type DTO schemas
exports.createFuelTypeSchema = common_validation_schemas_1.commonFieldsSchema
    .extend({
    description: zod_1.z.string().max(8000).optional(),
})
    .extend(common_validation_schemas_1.metaFieldsSchema.shape)
    .strict();
exports.updateFuelTypeSchema = exports.createFuelTypeSchema.partial().strict();
exports.fuelTypeFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1).optional(),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10).optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    q: zod_1.z.string().optional(),
    is_published: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
    is_featured: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
}).strict();
//# sourceMappingURL=fuel-type-validation.schemas.js.map