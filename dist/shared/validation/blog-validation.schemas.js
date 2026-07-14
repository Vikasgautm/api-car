"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blogFilterSchema = exports.updateBlogSchema = exports.createBlogSchema = void 0;
const zod_1 = require("zod");
const common_validation_schemas_1 = require("./common-validation.schemas");
// Blog DTO schemas
exports.createBlogSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters'),
    content: zod_1.z.string().min(10, 'Content must be at least 10 characters'),
    excerpt: zod_1.z.string().max(500).optional(),
    author_name: zod_1.z.string().min(2).optional(),
    author_id: common_validation_schemas_1.objectIdSchema.optional(),
    category: zod_1.z.string().min(2, 'Category must be at least 2 characters'),
    tags: zod_1.z.array(zod_1.z.string().min(2)).max(20, 'Cannot have more than 20 tags').optional(),
    thumbnail_url: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    thumbnail_alt: zod_1.z.string().max(200).optional(),
    images: zod_1.z.array(zod_1.z.object({
        url: zod_1.z.string().url(),
        alt: zod_1.z.string().optional(),
    })).optional(),
    link: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    is_published: zod_1.z.boolean().optional(),
    is_featured: zod_1.z.boolean().optional(),
}).extend(common_validation_schemas_1.metaFieldsSchema.shape).strict();
exports.updateBlogSchema = exports.createBlogSchema.partial().strict();
exports.blogFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1).optional(),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10).optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    q: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    tags: zod_1.z.string().optional(),
    is_published: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
    is_featured: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
}).strict();
