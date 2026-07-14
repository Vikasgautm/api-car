"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTagDto = exports.CreateTagDto = exports.UpdateTagCategoryDto = exports.CreateTagCategoryDto = void 0;
const zod_1 = require("zod");
const createTagCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    type: zod_1.z.string().min(1, 'Type is required'),
    description: zod_1.z.string().max(2000, 'Description cannot exceed 2000 characters').optional(),
    is_published: zod_1.z.boolean().optional(),
    sort_order: zod_1.z.number().optional(),
}).strict();
const updateTagCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').optional(),
    type: zod_1.z.string().min(1, 'Type is required').optional(),
    description: zod_1.z.string().max(2000, 'Description cannot exceed 2000 characters').optional(),
    is_published: zod_1.z.boolean().optional(),
    sort_order: zod_1.z.number().optional(),
}).strict();
const createTagSchema = zod_1.z.object({
    tag_category_id: zod_1.z.string().min(1, 'Category is required'),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    description: zod_1.z.string().max(2000, 'Description cannot exceed 2000 characters').optional(),
    seo_meta: zod_1.z.object({
        title: zod_1.z.string().optional(),
        description: zod_1.z.string().max(160, 'SEO meta description cannot exceed 160 characters').optional(),
        h1: zod_1.z.string().optional(),
    }).optional(),
    is_published: zod_1.z.boolean().optional(),
    sort_order: zod_1.z.number().optional(),
}).strict();
const updateTagSchema = zod_1.z.object({
    tag_category_id: zod_1.z.string().min(1, 'Category is required').optional(),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').optional(),
    description: zod_1.z.string().max(2000, 'Description cannot exceed 2000 characters').optional(),
    seo_meta: zod_1.z.object({
        title: zod_1.z.string().optional(),
        description: zod_1.z.string().max(160, 'SEO meta description cannot exceed 160 characters').optional(),
        h1: zod_1.z.string().optional(),
    }).optional(),
    is_published: zod_1.z.boolean().optional(),
    sort_order: zod_1.z.number().optional(),
}).strict();
class CreateTagCategoryDto {
    name;
    type;
    description;
    is_published;
    sort_order;
    static validate(dto) {
        const res = createTagCategorySchema.safeParse(dto);
        return res;
    }
}
exports.CreateTagCategoryDto = CreateTagCategoryDto;
class UpdateTagCategoryDto {
    name;
    type;
    description;
    is_published;
    sort_order;
    static validate(dto) {
        const res = updateTagCategorySchema.safeParse(dto);
        return res;
    }
}
exports.UpdateTagCategoryDto = UpdateTagCategoryDto;
class CreateTagDto {
    tag_category_id;
    name;
    description;
    seo_meta;
    is_published;
    sort_order;
    static validate(dto) {
        const res = createTagSchema.safeParse(dto);
        return res;
    }
}
exports.CreateTagDto = CreateTagDto;
class UpdateTagDto {
    tag_category_id;
    name;
    description;
    seo_meta;
    is_published;
    sort_order;
    static validate(dto) {
        const res = updateTagSchema.safeParse(dto);
        return res;
    }
}
exports.UpdateTagDto = UpdateTagDto;
