"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageSubCategoryService = void 0;
const uuid_1 = require("uuid");
const image_category_model_1 = require("../../../models/image-category.model");
const image_subcategory_model_1 = require("../../../models/image-subcategory.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const filter_util_1 = require("../../../shared/utils/filter.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const slug_util_1 = require("../../../shared/utils/slug.util");
class ImageSubCategoryService {
    static async getAllImageSubCategories(filterDto, includeDeleted = false) {
        const { page = 1, limit = 10, category_id, is_active, is_deleted, q, sortBy = 'display_order', sortOrder = 'asc', } = filterDto;
        const filter = {};
        if (is_deleted === 'true' || is_deleted === true) {
            filter.is_deleted = true;
        }
        else if (!includeDeleted) {
            filter.is_deleted = false;
        }
        if (category_id)
            filter.category_id = category_id;
        if (is_active !== undefined)
            filter.is_active = is_active === 'true';
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
            ];
        }
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const sortFilter = filter_util_1.FilterUtil.buildSortFilter(sortBy, sortOrder);
        const subcategories = await image_subcategory_model_1.ImageSubCategory.find(filter)
            .populate('category_id', 'name slug')
            .select('id subcategory_id category_id name slug description is_active display_order')
            .sort(sortFilter)
            .skip(skip)
            .limit(validatedLimit)
            .lean();
        const total = await image_subcategory_model_1.ImageSubCategory.countDocuments(filter);
        const paginationMeta = pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total);
        return { subcategories, pagination: paginationMeta };
    }
    static async getImageSubCategoryById(subcategoryId) {
        return await image_subcategory_model_1.ImageSubCategory.findById(subcategoryId).populate('category_id', 'name slug');
    }
    static async getImageSubCategoryBySlug(slug) {
        return await image_subcategory_model_1.ImageSubCategory.findOne({ slug }).populate('category_id', 'name slug');
    }
    static async createImageSubCategory(subcategoryData) {
        // Validate category exists
        const category = await image_category_model_1.ImageCategory.findById(subcategoryData.category_id);
        if (!category) {
            throw new app_error_util_1.AppError('Image category not found', 404);
        }
        const slug = slug_util_1.SlugUtil.generate(subcategoryData.name);
        // Batch fetch all subcategories instead of two separate queries
        const allSubCategories = await image_subcategory_model_1.ImageSubCategory.find().select('slug').lean();
        const allSlugs = allSubCategories.map((c) => c.slug);
        const finalSlug = allSlugs.includes(slug) ? slug_util_1.SlugUtil.generateUnique(subcategoryData.name, allSlugs) : slug;
        subcategoryData.slug = finalSlug;
        const subcategory = {
            subcategory_id: subcategoryData.subcategory_id || (0, uuid_1.v4)(),
            category_id: subcategoryData.category_id,
            name: subcategoryData.name,
            slug: subcategoryData.slug,
            description: subcategoryData.description,
            is_active: subcategoryData.is_active !== undefined ? subcategoryData.is_active : true,
            display_order: subcategoryData.display_order || 0,
        };
        return await image_subcategory_model_1.ImageSubCategory.create(subcategory);
    }
    static async updateImageSubCategory(subcategoryId, subcategoryData) {
        const updateData = {};
        if (subcategoryData.category_id !== undefined) {
            const category = await image_category_model_1.ImageCategory.findById(subcategoryData.category_id);
            if (!category) {
                throw new app_error_util_1.AppError('Image category not found', 404);
            }
            updateData.category_id = subcategoryData.category_id;
        }
        if (subcategoryData.name !== undefined) {
            updateData.name = subcategoryData.name;
            const newSlug = slug_util_1.SlugUtil.generate(subcategoryData.name);
            const existingSlug = await image_subcategory_model_1.ImageSubCategory.findOne({ slug: newSlug, _id: { $ne: subcategoryId } });
            if (!existingSlug) {
                updateData.slug = newSlug;
            }
        }
        if (subcategoryData.description !== undefined)
            updateData.description = subcategoryData.description;
        if (subcategoryData.is_active !== undefined)
            updateData.is_active = subcategoryData.is_active;
        if (subcategoryData.display_order !== undefined)
            updateData.display_order = subcategoryData.display_order;
        const subcategory = await image_subcategory_model_1.ImageSubCategory.findByIdAndUpdate(subcategoryId, updateData, { returnDocument: 'after' });
        if (!subcategory) {
            throw new app_error_util_1.AppError('Image subcategory not found', 404);
        }
        return subcategory;
    }
    static async deleteImageSubCategory(subcategoryId) {
        const subcategory = await image_subcategory_model_1.ImageSubCategory.findByIdAndUpdate(subcategoryId, { is_deleted: true, deleted_at: new Date() }, { returnDocument: 'after' });
        if (!subcategory) {
            throw new app_error_util_1.AppError('Image subcategory not found', 404);
        }
        return subcategory;
    }
    static async restoreImageSubCategory(subcategoryId) {
        const subcategory = await image_subcategory_model_1.ImageSubCategory.findByIdAndUpdate(subcategoryId, { is_deleted: false, deleted_at: null }, { returnDocument: 'after' });
        if (!subcategory) {
            throw new app_error_util_1.AppError('Image subcategory not found', 404);
        }
        return subcategory;
    }
    static async toggleImageSubCategoryActive(subcategoryId, is_active) {
        const subcategory = await image_subcategory_model_1.ImageSubCategory.findByIdAndUpdate(subcategoryId, { is_active }, { returnDocument: 'after' });
        if (!subcategory) {
            throw new app_error_util_1.AppError('Image subcategory not found', 404);
        }
        return subcategory;
    }
    static async reorderImageSubCategories(orders) {
        const bulkOperations = orders.map(order => ({
            updateOne: {
                filter: { _id: order._id },
                update: { display_order: order.display_order }
            }
        }));
        await image_subcategory_model_1.ImageSubCategory.bulkWrite(bulkOperations);
    }
}
exports.ImageSubCategoryService = ImageSubCategoryService;
