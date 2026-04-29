"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyTypeService = void 0;
const uuid_1 = require("uuid");
const body_type_model_1 = require("../../../models/body-type.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const filter_util_1 = require("../../../shared/utils/filter.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const slug_util_1 = require("../../../shared/utils/slug.util");
class BodyTypeService {
    static async getAllBodyTypes(filterDto, includeDeleted = false) {
        const { page = 1, limit = 10, q, is_published, is_featured, sortBy = 'name', sortOrder = 'asc' } = filterDto;
        const filter = {};
        if (!includeDeleted) {
            filter.is_deleted = false;
        }
        if (is_published !== undefined) {
            filter.is_published = is_published;
        }
        if (is_featured !== undefined) {
            filter.is_featured = is_featured;
        }
        if (q) {
            const searchFilter = filter_util_1.FilterUtil.buildSearchFilter(['name', 'description'], q);
            Object.assign(filter, searchFilter);
        }
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const sortFilter = filter_util_1.FilterUtil.buildSortFilter(sortBy, sortOrder);
        const bodyTypes = await body_type_model_1.BodyType.find(filter)
            .sort(sortFilter)
            .skip(skip)
            .limit(validatedLimit);
        const total = await body_type_model_1.BodyType.countDocuments(filter);
        const paginationMeta = pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total);
        return { bodyTypes, pagination: paginationMeta };
    }
    static async getBodyTypeById(bodyTypeId) {
        return await body_type_model_1.BodyType.findOne({ body_type_id: bodyTypeId, is_deleted: false });
    }
    static async getBodyTypeBySlug(slug) {
        return await body_type_model_1.BodyType.findOne({ slug, is_deleted: false });
    }
    static async createBodyType(bodyTypeData) {
        const body_type_id = (0, uuid_1.v4)();
        const slug = slug_util_1.SlugUtil.generate(bodyTypeData.name);
        const existingSlug = await body_type_model_1.BodyType.findOne({ slug, is_deleted: false });
        if (existingSlug) {
            const existingSlugs = (await body_type_model_1.BodyType.find({ is_deleted: false }).select('slug')).map(b => b.slug);
            const uniqueSlug = slug_util_1.SlugUtil.generateUnique(bodyTypeData.name, existingSlugs);
            bodyTypeData.slug = uniqueSlug;
        }
        else {
            bodyTypeData.slug = slug;
        }
        const bodyType = {
            body_type_id,
            name: bodyTypeData.name,
            slug: bodyTypeData.slug,
            description: bodyTypeData.description,
            is_published: bodyTypeData.is_published || false,
            is_featured: bodyTypeData.is_featured || false,
            is_deleted: false,
        };
        if (bodyTypeData.logo_url) {
            bodyType.logo = {
                url: bodyTypeData.logo_url,
                title: bodyTypeData.logo_title || bodyTypeData.name,
            };
        }
        return await body_type_model_1.BodyType.create(bodyType);
    }
    static async updateBodyType(bodyTypeId, bodyTypeData) {
        const updateData = {};
        if (bodyTypeData.name !== undefined) {
            updateData.name = bodyTypeData.name;
            const newSlug = slug_util_1.SlugUtil.generate(bodyTypeData.name);
            const existingSlug = await body_type_model_1.BodyType.findOne({ slug: newSlug, body_type_id: { $ne: bodyTypeId }, is_deleted: false });
            if (!existingSlug) {
                updateData.slug = newSlug;
            }
        }
        if (bodyTypeData.description !== undefined)
            updateData.description = bodyTypeData.description;
        if (bodyTypeData.is_published !== undefined)
            updateData.is_published = bodyTypeData.is_published;
        if (bodyTypeData.is_featured !== undefined)
            updateData.is_featured = bodyTypeData.is_featured;
        if (bodyTypeData.logo_url !== undefined) {
            if (bodyTypeData.logo_url) {
                updateData.logo = {
                    url: bodyTypeData.logo_url,
                    title: bodyTypeData.logo_title || bodyTypeData.name,
                };
            }
            else {
                updateData.logo = undefined;
            }
        }
        const bodyType = await body_type_model_1.BodyType.findOneAndUpdate({ body_type_id: bodyTypeId, is_deleted: false }, updateData, { returnDocument: 'after' });
        if (!bodyType) {
            throw new app_error_util_1.AppError('Body type not found', 404);
        }
        return bodyType;
    }
    static async deleteBodyType(bodyTypeId) {
        const bodyType = await body_type_model_1.BodyType.findOneAndUpdate({ body_type_id: bodyTypeId, is_deleted: false }, { is_deleted: true }, { returnDocument: 'after' });
        if (!bodyType) {
            throw new app_error_util_1.AppError('Body type not found', 404);
        }
        return bodyType;
    }
    static async restoreBodyType(bodyTypeId) {
        const bodyType = await body_type_model_1.BodyType.findOneAndUpdate({ body_type_id: bodyTypeId, is_deleted: true }, { is_deleted: false }, { returnDocument: 'after' });
        if (!bodyType) {
            throw new app_error_util_1.AppError('Body type not found', 404);
        }
        return bodyType;
    }
    static async togglePublish(bodyTypeId) {
        const bodyType = await body_type_model_1.BodyType.findOne({ body_type_id: bodyTypeId, is_deleted: false });
        if (!bodyType) {
            throw new app_error_util_1.AppError('Body type not found', 404);
        }
        bodyType.is_published = !bodyType.is_published;
        await bodyType.save();
        return bodyType;
    }
}
exports.BodyTypeService = BodyTypeService;
//# sourceMappingURL=bodyType.service.js.map