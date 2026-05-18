"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagService = void 0;
const uuid_1 = require("uuid");
const tag_category_model_1 = require("../../../models/tag-category.model");
const tag_model_1 = require("../../../models/tag.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const filter_util_1 = require("../../../shared/utils/filter.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const slug_util_1 = require("../../../shared/utils/slug.util");
class TagService {
    static async getAll(filterDto, includeDeleted = false) {
        const { page = 1, limit = 50, q, tag_category_id, tag_category_slug, type, is_published, is_deleted, sortBy = 'sort_order', sortOrder = 'asc', } = filterDto;
        const filter = {};
        if (is_deleted === 'true' || is_deleted === true) {
            filter.is_deleted = true;
        }
        else if (!includeDeleted) {
            filter.is_deleted = false;
        }
        if (is_published !== undefined)
            filter.is_published = is_published;
        if (tag_category_id) {
            filter.tag_category_id = tag_category_id;
        }
        else if (tag_category_slug || type) {
            const catFilter = { is_deleted: false };
            if (tag_category_slug)
                catFilter.slug = tag_category_slug;
            if (type)
                catFilter.type = type;
            const matchingCategoryIds = await tag_category_model_1.TagCategory.find(catFilter).distinct('tag_category_id');
            filter.tag_category_id = { $in: matchingCategoryIds };
        }
        if (q) {
            Object.assign(filter, filter_util_1.FilterUtil.buildSearchFilter(['name', 'description'], q));
        }
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const sortFilter = filter_util_1.FilterUtil.buildSortFilter(sortBy, sortOrder);
        const [tags, total] = await Promise.all([
            tag_model_1.Tag.find(filter).sort(sortFilter).skip(skip).limit(validatedLimit).lean(),
            tag_model_1.Tag.countDocuments(filter),
        ]);
        return {
            tags,
            pagination: pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total),
        };
    }
    static async getById(tagId) {
        return tag_model_1.Tag.findOne({ tag_id: tagId, is_deleted: false });
    }
    static async getBySlug(slug) {
        return tag_model_1.Tag.findOne({ slug, is_deleted: false });
    }
    static async create(data) {
        const category = await tag_category_model_1.TagCategory.findOne({
            tag_category_id: data.tag_category_id,
            is_deleted: false,
        });
        if (!category) {
            throw new app_error_util_1.AppError(`Tag category not found: ${data.tag_category_id}`, 404);
        }
        const tag_id = (0, uuid_1.v4)();
        const baseSlug = slug_util_1.SlugUtil.generate(data.name);
        const existingSlug = await tag_model_1.Tag.findOne({ slug: baseSlug, is_deleted: false });
        let slug = baseSlug;
        if (existingSlug) {
            const pattern = new RegExp(`^${baseSlug}(-\\d+)?$`);
            const matchingSlugs = (await tag_model_1.Tag.find({ slug: pattern, is_deleted: false }).select('slug').lean()).map((t) => t.slug);
            slug = slug_util_1.SlugUtil.generateUnique(data.name, matchingSlugs);
        }
        const doc = {
            tag_id,
            tag_category_id: data.tag_category_id,
            name: data.name,
            slug,
            description: data.description,
            seo_meta: data.seo_meta,
            is_published: data.is_published !== undefined ? data.is_published : true,
            sort_order: data.sort_order ?? 0,
            is_deleted: false,
        };
        return tag_model_1.Tag.create(doc);
    }
    static async update(tagId, data) {
        if (data.tag_category_id !== undefined) {
            const category = await tag_category_model_1.TagCategory.findOne({
                tag_category_id: data.tag_category_id,
                is_deleted: false,
            });
            if (!category) {
                throw new app_error_util_1.AppError(`Tag category not found: ${data.tag_category_id}`, 404);
            }
        }
        const updateData = {};
        if (data.tag_category_id !== undefined)
            updateData.tag_category_id = data.tag_category_id;
        if (data.name !== undefined) {
            updateData.name = data.name;
            const newSlug = slug_util_1.SlugUtil.generate(data.name);
            const conflict = await tag_model_1.Tag.findOne({
                slug: newSlug,
                tag_id: { $ne: tagId },
                is_deleted: false,
            });
            if (!conflict)
                updateData.slug = newSlug;
        }
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.seo_meta !== undefined)
            updateData.seo_meta = data.seo_meta;
        if (data.is_published !== undefined)
            updateData.is_published = data.is_published;
        if (data.sort_order !== undefined)
            updateData.sort_order = data.sort_order;
        const updated = await tag_model_1.Tag.findOneAndUpdate({ tag_id: tagId, is_deleted: false }, updateData, { returnDocument: 'after' });
        if (!updated) {
            throw new app_error_util_1.AppError(`Tag not found: ${tagId}`, 404);
        }
        return updated;
    }
    static async softDelete(tagId) {
        const updated = await tag_model_1.Tag.findOneAndUpdate({ tag_id: tagId, is_deleted: false }, { is_deleted: true }, { returnDocument: 'after' });
        if (!updated) {
            throw new app_error_util_1.AppError(`Tag not found: ${tagId}`, 404);
        }
        return updated;
    }
    static async restore(tagId) {
        const updated = await tag_model_1.Tag.findOneAndUpdate({ tag_id: tagId, is_deleted: true }, { is_deleted: false }, { returnDocument: 'after' });
        if (!updated) {
            throw new app_error_util_1.AppError(`Tag not found in deleted records: ${tagId}`, 404);
        }
        return updated;
    }
    static async validateTagIds(tagIds) {
        if (!tagIds || tagIds.length === 0) {
            return { valid: [], invalid: [] };
        }
        const found = await tag_model_1.Tag.find({
            tag_id: { $in: tagIds },
            is_deleted: false,
        }).distinct('tag_id');
        const foundSet = new Set(found);
        return {
            valid: tagIds.filter(id => foundSet.has(id)),
            invalid: tagIds.filter(id => !foundSet.has(id)),
        };
    }
}
exports.TagService = TagService;
//# sourceMappingURL=tag.service.js.map