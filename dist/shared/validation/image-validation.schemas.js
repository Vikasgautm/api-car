"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageFilterSchema = exports.bulkDeleteSchema = exports.bulkCategorySchema = exports.bulkStatusSchema = exports.carImageFilterSchema = exports.updateCarImageSchema = exports.createCarImageSchema = exports.updateImageSchema = exports.createImageSchema = void 0;
const zod_1 = require("zod");
const common_validation_schemas_1 = require("./common-validation.schemas");
const media_constants_1 = require("../services/media/media-constants");
// ─── Generic image schemas (unchanged) ───────────────────────────────────────
exports.createImageSchema = zod_1.z.object({
    url: zod_1.z.string().url('Invalid image URL'),
    alt_text: zod_1.z.string().max(200).optional(),
    caption: zod_1.z.string().max(500).optional(),
    tags: zod_1.z.array(zod_1.z.string().min(2)).max(20).optional(),
    folder: zod_1.z.string().optional(),
}).strict();
exports.updateImageSchema = exports.createImageSchema.partial().strict();
// ─── Car image schemas ────────────────────────────────────────────────────────
exports.createCarImageSchema = zod_1.z.object({
    car_id: zod_1.z.string().min(1),
    variant_id: zod_1.z.string().optional(),
    main_category: zod_1.z.enum(media_constants_1.MAIN_CATEGORIES).optional(),
    sub_category: zod_1.z.enum(media_constants_1.ALL_SUBCATEGORIES).optional(),
    media_scope: zod_1.z.enum(media_constants_1.MEDIA_SCOPES).optional(),
    normalized_color: zod_1.z.string().optional(),
    display_color_name: zod_1.z.string().max(100).optional(),
    url: zod_1.z.string().url('Invalid image URL').optional(),
    image_hash: zod_1.z.string().optional(),
    image_title: zod_1.z.string().max(200).optional(),
    alt_text: zod_1.z.string().max(300).optional(),
    caption: zod_1.z.string().max(500).optional(),
    tags: zod_1.z.array(zod_1.z.string()).max(20).optional(),
    source: zod_1.z.string().optional(),
    status: zod_1.z.enum(media_constants_1.IMAGE_STATUSES).optional(),
    is_primary: zod_1.z.boolean().optional(),
    is_published: zod_1.z.boolean().optional(),
    sort_order: zod_1.z.number().int().min(0).optional(),
    display_order: zod_1.z.number().int().min(0).optional(),
});
exports.updateCarImageSchema = exports.createCarImageSchema.partial();
exports.carImageFilterSchema = common_validation_schemas_1.paginationSchema.extend({
    car_id: zod_1.z.string().optional(),
    variant_id: zod_1.z.string().optional(),
    main_category: zod_1.z.enum(media_constants_1.MAIN_CATEGORIES).optional(),
    sub_category: zod_1.z.enum(media_constants_1.ALL_SUBCATEGORIES).optional(),
    media_scope: zod_1.z.enum(media_constants_1.MEDIA_SCOPES).optional(),
    status: zod_1.z.enum(media_constants_1.IMAGE_STATUSES).optional(),
    is_primary: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
    is_published: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
    is_deleted: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
});
// ─── Bulk operation schemas ───────────────────────────────────────────────────
exports.bulkStatusSchema = zod_1.z.object({
    image_ids: zod_1.z.array(zod_1.z.string().min(1)).min(1).max(100),
    status: zod_1.z.enum(media_constants_1.IMAGE_STATUSES),
});
exports.bulkCategorySchema = zod_1.z.object({
    image_ids: zod_1.z.array(zod_1.z.string().min(1)).min(1).max(100),
    main_category: zod_1.z.enum(media_constants_1.MAIN_CATEGORIES),
    sub_category: zod_1.z.enum(media_constants_1.ALL_SUBCATEGORIES).optional(),
});
exports.bulkDeleteSchema = zod_1.z.object({
    image_ids: zod_1.z.array(zod_1.z.string().min(1)).min(1).max(100),
});
// ─── Legacy filter schema (kept for backward compat) ─────────────────────────
exports.imageFilterSchema = common_validation_schemas_1.paginationSchema.extend({
    folder: zod_1.z.string().optional(),
    is_published: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
}).strict();
//# sourceMappingURL=image-validation.schemas.js.map