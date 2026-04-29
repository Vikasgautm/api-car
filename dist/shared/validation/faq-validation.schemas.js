"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.faqFilterSchema = exports.updateFaqSchema = exports.createFaqSchema = void 0;
const zod_1 = require("zod");
const common_validation_schemas_1 = require("./common-validation.schemas");
// FAQ DTO schemas
exports.createFaqSchema = zod_1.z.object({
    question: zod_1.z.string().min(10, 'Question must be at least 10 characters'),
    answer: zod_1.z.string().min(20, 'Answer must be at least 20 characters'),
    category: zod_1.z.string().min(2, 'Category must be at least 2 characters'),
    order: zod_1.z.number().int().nonnegative().optional(),
    tags: zod_1.z.array(zod_1.z.string().min(2)).max(20, 'Cannot have more than 20 tags').optional(),
    answer_format: common_validation_schemas_1.answerFormatSchema.optional(),
    faq_group: zod_1.z.string().min(2).optional(),
    related_cars: zod_1.z.array(common_validation_schemas_1.uuidSchema).optional(),
    related_brands: zod_1.z.array(common_validation_schemas_1.uuidSchema).optional(),
    related_blogs: zod_1.z.array(common_validation_schemas_1.uuidSchema).optional(),
    is_published: zod_1.z.boolean().optional(),
    is_featured: zod_1.z.boolean().optional(),
}).strict();
exports.updateFaqSchema = exports.createFaqSchema.partial().strict();
exports.faqFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1).optional(),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10).optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    q: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    is_published: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
    is_featured: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
}).strict();
//# sourceMappingURL=faq-validation.schemas.js.map