"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bodyTypeFilterSchema = exports.updateBodyTypeSchema = exports.createBodyTypeSchema = void 0;
const zod_1 = require("zod");
const common_validation_schemas_1 = require("./common-validation.schemas");
// Body Type DTO schemas
exports.createBodyTypeSchema = common_validation_schemas_1.commonFieldsSchema
    .extend({
    description: zod_1.z.string().max(500).optional(),
})
    .extend(common_validation_schemas_1.metaFieldsSchema.shape)
    .strict();
exports.updateBodyTypeSchema = exports.createBodyTypeSchema.partial().strict();
exports.bodyTypeFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1).optional(),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10).optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    q: zod_1.z.string().optional(),
    is_published: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
    is_featured: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
}).strict();
//# sourceMappingURL=body-type-validation.schemas.js.map