"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagCategoryService = void 0;
const uuid_1 = require("uuid");
const tag_category_model_1 = require("../../../models/tag-category.model");
const tag_model_1 = require("../../../models/tag.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const filter_util_1 = require("../../../shared/utils/filter.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const slug_util_1 = require("../../../shared/utils/slug.util");
class TagCategoryService {
    static async getAll(filterDto, includeDeleted = false) {
        const { page = 1, limit = 50, q, type, is_published, is_deleted, sortBy = 'sort_order', sortOrder = 'asc', } = filterDto;
        const filter = {};
        if (is_deleted === 'true' || is_deleted === true) {
            filter.is_deleted = true;
        }
        else if (!includeDeleted) {
            filter.is_deleted = false;
        }
        if (is_published !== undefined)
            filter.is_published = is_published;
        if (type)
            filter.type = type;
        if (q) {
            Object.assign(filter, filter_util_1.FilterUtil.buildSearchFilter(['name', 'description'], q));
        }
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const sortFilter = filter_util_1.FilterUtil.buildSortFilter(sortBy, sortOrder);
        const [categories, total] = await Promise.all([
            tag_category_model_1.TagCategory.find(filter).sort(sortFilter).skip(skip).limit(validatedLimit).lean(),
            tag_category_model_1.TagCategory.countDocuments(filter),
        ]);
        return {
            categories,
            pagination: pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total),
        };
    }
    static async getById(tagCategoryId) {
        return tag_category_model_1.TagCategory.findOne({ tag_category_id: tagCategoryId, is_deleted: false });
    }
    static async getBySlug(slug) {
        return tag_category_model_1.TagCategory.findOne({ slug, is_deleted: false });
    }
    static async create(data) {
        const tag_category_id = (0, uuid_1.v4)();
        const baseSlug = slug_util_1.SlugUtil.generate(data.name);
        const existingSlug = await tag_category_model_1.TagCategory.findOne({ slug: baseSlug, is_deleted: false });
        let slug = baseSlug;
        if (existingSlug) {
            const pattern = new RegExp(`^${baseSlug}(-\\d+)?$`);
            const matchingSlugs = (await tag_category_model_1.TagCategory.find({ slug: pattern, is_deleted: false }).select('slug').lean()).map((c) => c.slug);
            slug = slug_util_1.SlugUtil.generateUnique(data.name, matchingSlugs);
        }
        const doc = {
            tag_category_id,
            name: data.name,
            slug,
            type: data.type,
            description: data.description,
            is_published: data.is_published !== undefined ? data.is_published : true,
            sort_order: data.sort_order ?? 0,
            is_deleted: false,
        };
        return tag_category_model_1.TagCategory.create(doc);
    }
    static async update(tagCategoryId, data) {
        const updateData = {};
        if (data.name !== undefined) {
            updateData.name = data.name;
            const newSlug = slug_util_1.SlugUtil.generate(data.name);
            const conflict = await tag_category_model_1.TagCategory.findOne({
                slug: newSlug,
                tag_category_id: { $ne: tagCategoryId },
                is_deleted: false,
            });
            if (!conflict)
                updateData.slug = newSlug;
        }
        if (data.type !== undefined)
            updateData.type = data.type;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.is_published !== undefined)
            updateData.is_published = data.is_published;
        if (data.sort_order !== undefined)
            updateData.sort_order = data.sort_order;
        const updated = await tag_category_model_1.TagCategory.findOneAndUpdate({ tag_category_id: tagCategoryId, is_deleted: false }, updateData, { returnDocument: 'after' });
        if (!updated) {
            throw new app_error_util_1.AppError(`Tag category not found: ${tagCategoryId}`, 404);
        }
        return updated;
    }
    static async softDelete(tagCategoryId) {
        const tagsInCategory = await tag_model_1.Tag.countDocuments({ tag_category_id: tagCategoryId, is_deleted: false });
        if (tagsInCategory > 0) {
            throw new app_error_util_1.AppError(`Cannot delete tag category: ${tagsInCategory} tag(s) still belong to it. Delete or move those tags first.`, 400);
        }
        const updated = await tag_category_model_1.TagCategory.findOneAndUpdate({ tag_category_id: tagCategoryId, is_deleted: false }, { is_deleted: true }, { returnDocument: 'after' });
        if (!updated) {
            throw new app_error_util_1.AppError(`Tag category not found: ${tagCategoryId}`, 404);
        }
        return updated;
    }
    static async restore(tagCategoryId) {
        const updated = await tag_category_model_1.TagCategory.findOneAndUpdate({ tag_category_id: tagCategoryId, is_deleted: true }, { is_deleted: false }, { returnDocument: 'after' });
        if (!updated) {
            throw new app_error_util_1.AppError(`Tag category not found in deleted records: ${tagCategoryId}`, 404);
        }
        return updated;
    }
}
exports.TagCategoryService = TagCategoryService;
//# sourceMappingURL=tag-category.service.js.map