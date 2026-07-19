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
    is_published: common_validation_schemas_1.booleanStringSchema.optional(),
    is_featured: common_validation_schemas_1.booleanStringSchema.optional(),
    faq_type: zod_1.z.string().optional(),
    intent_type: zod_1.z.string().optional(),
    entity_type: zod_1.z.string().optional(),
    entity_id: common_validation_schemas_1.uuidSchema.optional(),
    related_entities: zod_1.z
        .array(zod_1.z.union([
        zod_1.z.object({
            entity_type: zod_1.z.string(),
            entity_id: common_validation_schemas_1.uuidSchema,
        }),
        common_validation_schemas_1.uuidSchema,
    ]))
        .optional(),
    target_page_types: zod_1.z.array(zod_1.z.string()).optional(),
    template_key: zod_1.z.string().optional(),
    is_dynamic: common_validation_schemas_1.booleanStringSchema.optional(),
    is_editorial: common_validation_schemas_1.booleanStringSchema.optional(),
    indexable: common_validation_schemas_1.booleanStringSchema.optional(),
    schema_enabled: common_validation_schemas_1.booleanStringSchema.optional(),
    needs_refresh: common_validation_schemas_1.booleanStringSchema.optional(),
    canonical_intent_key: zod_1.z.string().optional(),
    priority_score: zod_1.z.number().optional(),
    visibility_status: zod_1.z.string().optional(),
    source_type: zod_1.z.string().optional(),
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
