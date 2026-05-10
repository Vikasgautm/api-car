"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrandService = void 0;
const uuid_1 = require("uuid");
const errorMessages_1 = require("../../../constants/errorMessages");
const brand_model_1 = require("../../../models/brand.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const filter_util_1 = require("../../../shared/utils/filter.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const slug_util_1 = require("../../../shared/utils/slug.util");
class BrandService {
    static async getAllBrands(filterDto, includeDeleted = false) {
        const { page = 1, limit = 10, q, is_published, is_featured, is_deleted, sortBy = 'name', sortOrder = 'asc' } = filterDto;
        const filter = {};
        if (is_deleted === 'true' || is_deleted === true) {
            filter.is_deleted = true;
        }
        else if (!includeDeleted) {
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
        const brands = await brand_model_1.Brand.find(filter)
            .sort(sortFilter)
            .skip(skip)
            .limit(validatedLimit);
        const total = await brand_model_1.Brand.countDocuments(filter);
        const paginationMeta = pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total);
        return { brands, pagination: paginationMeta };
    }
    static async getBrandById(brandId) {
        return await brand_model_1.Brand.findOne({ brand_id: brandId, is_deleted: false });
    }
    static async getBrandBySlug(slug) {
        return await brand_model_1.Brand.findOne({ slug, is_deleted: false, is_published: true }).lean();
    }
    static async createBrand(brandData) {
        const brand_id = (0, uuid_1.v4)();
        const slug = slug_util_1.SlugUtil.generate(brandData.name);
        const existingSlug = await brand_model_1.Brand.findOne({ slug, is_deleted: false });
        if (existingSlug) {
            const existingSlugs = (await brand_model_1.Brand.find({ is_deleted: false }).select('slug')).map(b => b.slug);
            const uniqueSlug = slug_util_1.SlugUtil.generateUnique(brandData.name, existingSlugs);
            brandData.slug = uniqueSlug;
        }
        else {
            brandData.slug = slug;
        }
        const brand = {
            brand_id,
            name: brandData.name,
            slug: brandData.slug,
            description: brandData.description,
            logo: brandData.logo_url ? {
                url: brandData.logo_url,
                title: brandData.logo_title,
            } : undefined,
            website: brandData.website,
            is_published: brandData.is_published || false,
            is_featured: brandData.is_featured || false,
            is_deleted: false,
            meta_title: brandData.meta_title,
            meta_description: brandData.meta_description,
            meta_keywords: brandData.meta_keywords,
            og_image: brandData.og_image,
            canonical_url: brandData.canonical_url,
            noindex: brandData.noindex,
        };
        return await brand_model_1.Brand.create(brand);
    }
    static async updateBrand(brandId, brandData) {
        const updateData = {};
        if (brandData.name !== undefined) {
            updateData.name = brandData.name;
            const newSlug = slug_util_1.SlugUtil.generate(brandData.name);
            const existingSlug = await brand_model_1.Brand.findOne({ slug: newSlug, brand_id: { $ne: brandId }, is_deleted: false });
            if (!existingSlug) {
                updateData.slug = newSlug;
            }
        }
        if (brandData.description !== undefined)
            updateData.description = brandData.description;
        if (brandData.logo_url !== undefined) {
            updateData.logo = {
                url: brandData.logo_url,
                title: brandData.logo_title,
            };
        }
        if (brandData.website !== undefined)
            updateData.website = brandData.website;
        if (brandData.is_published !== undefined)
            updateData.is_published = brandData.is_published;
        if (brandData.is_featured !== undefined)
            updateData.is_featured = brandData.is_featured;
        if (brandData.meta_title !== undefined)
            updateData.meta_title = brandData.meta_title;
        if (brandData.meta_description !== undefined)
            updateData.meta_description = brandData.meta_description;
        if (brandData.meta_keywords !== undefined)
            updateData.meta_keywords = brandData.meta_keywords;
        if (brandData.og_image !== undefined)
            updateData.og_image = brandData.og_image;
        if (brandData.canonical_url !== undefined)
            updateData.canonical_url = brandData.canonical_url;
        if (brandData.noindex !== undefined)
            updateData.noindex = brandData.noindex;
        const brand = await brand_model_1.Brand.findOneAndUpdate({ brand_id: brandId, is_deleted: false }, updateData, { returnDocument: 'after' });
        if (!brand) {
            throw new app_error_util_1.AppError(`Brand not found or deleted for brand_id: ${brandId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BRAND_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BRAND_NOT_FOUND,
                details: {
                    field: 'brand_id',
                    reason: 'The brand does not exist or has been deleted.',
                },
            });
        }
        return brand;
    }
    static async deleteBrand(brandId) {
        const brand = await brand_model_1.Brand.findOneAndUpdate({ brand_id: brandId, is_deleted: false }, { is_deleted: true }, { returnDocument: 'after' });
        if (!brand) {
            throw new app_error_util_1.AppError(`Brand not found or deleted for brand_id: ${brandId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BRAND_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BRAND_NOT_FOUND,
                details: {
                    field: 'brand_id',
                    reason: 'The brand does not exist or has already been deleted.',
                },
            });
        }
        return brand;
    }
    static async restoreBrand(brandId) {
        const brand = await brand_model_1.Brand.findOneAndUpdate({ brand_id: brandId, is_deleted: true }, { is_deleted: false }, { returnDocument: 'after' });
        if (!brand) {
            throw new app_error_util_1.AppError(`Brand not found for brand_id: ${brandId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BRAND_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BRAND_NOT_FOUND,
                details: {
                    field: 'brand_id',
                    reason: 'The brand does not exist in the deleted records.',
                },
            });
        }
        return brand;
    }
    static async togglePublish(brandId) {
        const brand = await brand_model_1.Brand.findOne({ brand_id: brandId, is_deleted: false });
        if (!brand) {
            throw new app_error_util_1.AppError(`Brand not found or deleted for brand_id: ${brandId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BRAND_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BRAND_NOT_FOUND,
                details: {
                    field: 'brand_id',
                    reason: 'The brand does not exist or has been deleted.',
                },
            });
        }
        brand.is_published = !brand.is_published;
        await brand.save();
        return brand;
    }
}
exports.BrandService = BrandService;
//# sourceMappingURL=brand.service.js.map