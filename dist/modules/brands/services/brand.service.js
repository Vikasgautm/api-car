"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrandService = void 0;
const uuid_1 = require("uuid");
const errorMessages_1 = require("../../../constants/errorMessages");
const brand_model_1 = require("../../../models/brand.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const brand_aggregation_service_1 = require("../../../shared/services/brand-aggregation.service");
const filter_util_1 = require("../../../shared/utils/filter.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const slug_util_1 = require("../../../shared/utils/slug.util");
const redirect_service_1 = require("../../redirects/services/redirect.service");
class BrandService {
    static async getAllBrands(filterDto, includeDeleted = false) {
        const { page = 1, limit = 20, q, is_published, is_featured, is_deleted, sortBy = 'name', sortOrder = 'asc', 
        // quick filters
        ev_brands, seo_incomplete, high_variants, is_upcoming, is_discontinued, } = filterDto;
        const filter = {};
        if (is_deleted === 'true' || is_deleted === true) {
            filter.is_deleted = true;
        }
        else if (!includeDeleted) {
            filter.is_deleted = false;
        }
        if (is_published !== undefined) {
            filter.is_published = is_published === 'true' || is_published === true;
        }
        if (is_featured !== undefined) {
            filter.is_featured = is_featured === 'true' || is_featured === true;
        }
        if (is_upcoming === 'true' || is_upcoming === true) {
            filter.is_upcoming = true;
        }
        if (is_discontinued === 'true' || is_discontinued === true) {
            filter.is_discontinued = true;
        }
        if (ev_brands === 'true' || ev_brands === true) {
            filter['aggregates_cache.has_ev'] = true;
        }
        if (seo_incomplete === 'true' || seo_incomplete === true) {
            filter.$or = [
                { meta_title: { $exists: false } },
                { meta_title: null },
                { meta_title: '' },
                { meta_description: { $exists: false } },
                { meta_description: null },
                { meta_description: '' },
            ];
        }
        if (high_variants === 'true' || high_variants === true) {
            filter['aggregates_cache.total_variants'] = { $gt: 20 };
        }
        if (q) {
            const searchFilter = filter_util_1.FilterUtil.buildSearchFilter(['name', 'description', 'alias'], q);
            Object.assign(filter, searchFilter);
        }
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const sortFilter = filter_util_1.FilterUtil.buildSortFilter(sortBy, sortOrder);
        const brands = await brand_model_1.Brand.find(filter).sort(sortFilter).skip(skip).limit(validatedLimit);
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
            const pattern = new RegExp(`^${slug}(-\\d+)?$`);
            const matchingSlugs = (await brand_model_1.Brand.find({ slug: pattern, is_deleted: false }).select('slug').lean()).map((b) => b.slug);
            brandData.slug = slug_util_1.SlugUtil.generateUnique(brandData.name, matchingSlugs);
        }
        else {
            brandData.slug = slug;
        }
        const brand = {
            brand_id,
            name: brandData.name,
            alias: brandData.alias,
            slug: brandData.slug,
            slug_history: [],
            short_description: brandData.short_description,
            description: brandData.description,
            founded_year: brandData.founded_year ? Number(brandData.founded_year) : undefined,
            country: brandData.country,
            parent_company: brandData.parent_company,
            logo: brandData.logo_url
                ? { url: brandData.logo_url, title: brandData.logo_title }
                : undefined,
            brand_media: brandData.brand_media,
            website: brandData.website,
            is_published: brandData.is_published || false,
            is_featured: brandData.is_featured || false,
            is_upcoming: brandData.is_upcoming || false,
            is_discontinued: brandData.is_discontinued || false,
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
        const existing = await brand_model_1.Brand.findOne({ brand_id: brandId, is_deleted: false });
        if (!existing) {
            throw new app_error_util_1.AppError(`Brand not found or deleted for brand_id: ${brandId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BRAND_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BRAND_NOT_FOUND,
                details: { field: 'brand_id', reason: 'The brand does not exist or has been deleted.' },
            });
        }
        const updateData = {};
        // Handle slug change
        let newSlug;
        if (brandData.slug && brandData.slug !== existing.slug) {
            const slugConflict = await brand_model_1.Brand.findOne({
                slug: brandData.slug,
                brand_id: { $ne: brandId },
                is_deleted: false,
            });
            if (slugConflict) {
                throw new app_error_util_1.AppError(`Slug "${brandData.slug}" is already in use by another brand.`, 409);
            }
            newSlug = brandData.slug;
        }
        else if (brandData.name && brandData.name !== existing.name) {
            const generated = slug_util_1.SlugUtil.generate(brandData.name);
            if (generated !== existing.slug) {
                const conflict = await brand_model_1.Brand.findOne({
                    slug: generated,
                    brand_id: { $ne: brandId },
                    is_deleted: false,
                });
                if (!conflict)
                    newSlug = generated;
            }
        }
        if (newSlug) {
            updateData.slug = newSlug;
            // Track old slug in history
            updateData.$push = {
                slug_history: { slug: existing.slug, changed_at: new Date() },
            };
            // Auto-create redirect from old → new brand URL
            try {
                await redirect_service_1.RedirectService.create({
                    old_url: `/brands/${existing.slug}`,
                    new_url: `/brands/${newSlug}`,
                    type: '301',
                    reason: `Brand slug changed from "${existing.slug}" to "${newSlug}"`,
                }, null);
            }
            catch {
                // Redirect may already exist or conflict — log but don't fail the update
            }
        }
        if (brandData.name !== undefined)
            updateData.name = brandData.name;
        if (brandData.alias !== undefined)
            updateData.alias = brandData.alias;
        if (brandData.short_description !== undefined)
            updateData.short_description = brandData.short_description;
        if (brandData.description !== undefined)
            updateData.description = brandData.description;
        if (brandData.founded_year !== undefined)
            updateData.founded_year = brandData.founded_year ? Number(brandData.founded_year) : null;
        if (brandData.country !== undefined)
            updateData.country = brandData.country;
        if (brandData.parent_company !== undefined)
            updateData.parent_company = brandData.parent_company;
        if (brandData.logo_url !== undefined) {
            updateData.logo = { url: brandData.logo_url, title: brandData.logo_title };
        }
        if (brandData.brand_media !== undefined) {
            // Merge media keys individually so partial updates don't wipe other keys
            for (const key of ['primary_logo', 'svg_logo', 'hero_banner', 'thumbnail', 'mobile_banner']) {
                if (brandData.brand_media[key] !== undefined) {
                    updateData[`brand_media.${key}`] = brandData.brand_media[key];
                }
            }
        }
        if (brandData.website !== undefined)
            updateData.website = brandData.website;
        if (brandData.is_published !== undefined)
            updateData.is_published = brandData.is_published;
        if (brandData.is_featured !== undefined)
            updateData.is_featured = brandData.is_featured;
        if (brandData.is_upcoming !== undefined)
            updateData.is_upcoming = brandData.is_upcoming;
        if (brandData.is_discontinued !== undefined)
            updateData.is_discontinued = brandData.is_discontinued;
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
        const { $push, ...setFields } = updateData;
        const mongoUpdate = { $set: setFields };
        if ($push)
            mongoUpdate.$push = $push;
        const brand = await brand_model_1.Brand.findOneAndUpdate({ brand_id: brandId, is_deleted: false }, mongoUpdate, { returnDocument: 'after' });
        if (!brand) {
            throw new app_error_util_1.AppError(`Brand not found or deleted for brand_id: ${brandId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BRAND_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BRAND_NOT_FOUND,
                details: { field: 'brand_id', reason: 'The brand does not exist or has been deleted.' },
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
                details: { field: 'brand_id', reason: 'The brand does not exist or has already been deleted.' },
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
                details: { field: 'brand_id', reason: 'The brand does not exist in the deleted records.' },
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
                details: { field: 'brand_id', reason: 'The brand does not exist or has been deleted.' },
            });
        }
        brand.is_published = !brand.is_published;
        await brand.save();
        return brand;
    }
    static async refreshAggregates(brandId) {
        const result = await brand_aggregation_service_1.BrandAggregationService.computeAndCache(brandId);
        if (!result) {
            throw new app_error_util_1.AppError(`Brand not found for brand_id: ${brandId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BRAND_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BRAND_NOT_FOUND,
                details: { field: 'brand_id', reason: 'The brand does not exist or has been deleted.' },
            });
        }
        return result;
    }
    static async refreshAllAggregates() {
        return brand_aggregation_service_1.BrandAggregationService.refreshAll();
    }
}
exports.BrandService = BrandService;
//# sourceMappingURL=brand.service.js.map