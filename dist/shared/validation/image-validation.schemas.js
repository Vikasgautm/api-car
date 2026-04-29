"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageFilterSchema = exports.updateCarImageSchema = exports.createCarImageSchema = exports.updateImageSchema = exports.createImageSchema = void 0;
const zod_1 = require("zod");
const common_validation_schemas_1 = require("./common-validation.schemas");
// Image DTO schemas
exports.createImageSchema = zod_1.z.object({
    url: zod_1.z.string().url('Invalid image URL'),
    alt_text: zod_1.z.string().max(200).optional(),
    caption: zod_1.z.string().max(500).optional(),
    tags: zod_1.z.array(zod_1.z.string().min(2)).max(20).optional(),
    folder: zod_1.z.string().optional(),
}).strict();
exports.updateImageSchema = exports.createImageSchema.partial().strict();
exports.createCarImageSchema = zod_1.z.object({
    car_id: common_validation_schemas_1.objectIdSchema,
    url: zod_1.z.string().url('Invalid image URL'),
    alt_text: zod_1.z.string().max(200).optional(),
    caption: zod_1.z.string().max(500).optional(),
    is_primary: zod_1.z.boolean().optional(),
    is_published: zod_1.z.boolean().optional(),
}).strict();
exports.updateCarImageSchema = exports.createCarImageSchema.partial().strict();
exports.imageFilterSchema = common_validation_schemas_1.paginationSchema.extend({
    folder: zod_1.z.string().optional(),
    is_published: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
}).strict();
//# sourceMappingURL=image-validation.schemas.js.map