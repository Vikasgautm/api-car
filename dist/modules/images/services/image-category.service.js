"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageCategoryService = void 0;
const image_category_model_1 = require("../../../models/image-category.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const filter_util_1 = require("../../../shared/utils/filter.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const slug_util_1 = require("../../../shared/utils/slug.util");
class ImageCategoryService {
    static async getAllImageCategories(filterDto, includeDeleted = false) {
        const { page = 1, limit = 10, is_active, is_deleted, q, sortBy = 'display_order', sortOrder = 'asc', } = filterDto;
        const filter = {};
        if (is_deleted === 'true' || is_deleted === true) {
            filter.is_deleted = true;
        }
        else if (!includeDeleted) {
            filter.is_deleted = false;
        }
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
        const categories = await image_category_model_1.ImageCategory.find(filter)
            .select('name slug description is_active display_order')
            .sort(sortFilter)
            .skip(skip)
            .limit(validatedLimit)
            .lean();
        const total = await image_category_model_1.ImageCategory.countDocuments(filter);
        const paginationMeta = pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total);
        return { categories, pagination: paginationMeta };
    }
    static async getImageCategoryById(categoryId) {
        return await image_category_model_1.ImageCategory.findById(categoryId);
    }
    static async getImageCategoryBySlug(slug) {
        return await image_category_model_1.ImageCategory.findOne({ slug });
    }
    static async createImageCategory(categoryData) {
        const slug = slug_util_1.SlugUtil.generate(categoryData.name);
        // Batch fetch all categories instead of two separate queries
        const allCategories = await image_category_model_1.ImageCategory.find().select('slug').lean();
        const allSlugs = allCategories.map((c) => c.slug);
        const finalSlug = allSlugs.includes(slug) ? slug_util_1.SlugUtil.generateUnique(categoryData.name, allSlugs) : slug;
        categoryData.slug = finalSlug;
        const category = {
            name: categoryData.name,
            slug: categoryData.slug,
            description: categoryData.description,
            is_active: categoryData.is_active !== undefined ? categoryData.is_active : true,
            display_order: categoryData.display_order || 0,
        };
        return await image_category_model_1.ImageCategory.create(category);
    }
    static async updateImageCategory(categoryId, categoryData) {
        const updateData = {};
        if (categoryData.name !== undefined) {
            updateData.name = categoryData.name;
            const newSlug = slug_util_1.SlugUtil.generate(categoryData.name);
            const existingSlug = await image_category_model_1.ImageCategory.findOne({ slug: newSlug, _id: { $ne: categoryId } });
            if (!existingSlug) {
                updateData.slug = newSlug;
            }
        }
        if (categoryData.description !== undefined)
            updateData.description = categoryData.description;
        if (categoryData.is_active !== undefined)
            updateData.is_active = categoryData.is_active;
        if (categoryData.display_order !== undefined)
            updateData.display_order = categoryData.display_order;
        const category = await image_category_model_1.ImageCategory.findByIdAndUpdate(categoryId, updateData, { returnDocument: 'after' });
        if (!category) {
            throw new app_error_util_1.AppError('Image category not found', 404);
        }
        return category;
    }
    static async deleteImageCategory(categoryId) {
        const category = await image_category_model_1.ImageCategory.findByIdAndUpdate(categoryId, { is_deleted: true, deleted_at: new Date() }, { returnDocument: 'after' });
        if (!category) {
            throw new app_error_util_1.AppError('Image category not found', 404);
        }
        return category;
    }
    static async restoreImageCategory(categoryId) {
        const category = await image_category_model_1.ImageCategory.findByIdAndUpdate(categoryId, { is_deleted: false, deleted_at: null }, { returnDocument: 'after' });
        if (!category) {
            throw new app_error_util_1.AppError('Image category not found', 404);
        }
        return category;
    }
    static async toggleImageCategoryActive(categoryId, is_active) {
        const category = await image_category_model_1.ImageCategory.findByIdAndUpdate(categoryId, { is_active }, { returnDocument: 'after' });
        if (!category) {
            throw new app_error_util_1.AppError('Image category not found', 404);
        }
        return category;
    }
    static async reorderImageCategories(orders) {
        const bulkOperations = orders.map(order => ({
            updateOne: {
                filter: { _id: order._id },
                update: { display_order: order.display_order }
            }
        }));
        await image_category_model_1.ImageCategory.bulkWrite(bulkOperations);
    }
}
exports.ImageCategoryService = ImageCategoryService;
//# sourceMappingURL=image-category.service.js.map