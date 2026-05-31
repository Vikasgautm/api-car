"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuelTypeService = void 0;
const uuid_1 = require("uuid");
const errorMessages_1 = require("../../../constants/errorMessages");
const fuel_type_model_1 = require("../../../models/fuel-type.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const filter_util_1 = require("../../../shared/utils/filter.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const slug_util_1 = require("../../../shared/utils/slug.util");
const cache_util_1 = require("../../../utils/cache.util");
class FuelTypeService {
    static async getAllFuelTypes(filterDto, includeDeleted = false) {
        const { page = 1, limit = 10, q, is_published, is_featured, is_deleted, sortBy = 'name', sortOrder = 'asc' } = filterDto;
        // Only cache simple published queries without complex filters
        const isSimpleQuery = !q && !is_featured && page === 1 && limit === 10 && is_published === 'true' && !includeDeleted;
        const cacheKey = cache_util_1.CacheKeys.fuelType.all({ is_published: true, page: 1, limit: 10 });
        if (isSimpleQuery) {
            const cached = cache_util_1.cache.get(cacheKey);
            if (cached)
                return cached;
        }
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
        const fuelTypes = await fuel_type_model_1.FuelType.find(filter)
            .sort(sortFilter)
            .skip(skip)
            .limit(validatedLimit);
        const total = await fuel_type_model_1.FuelType.countDocuments(filter);
        const paginationMeta = pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total);
        const result = { fuelTypes, pagination: paginationMeta };
        if (isSimpleQuery) {
            cache_util_1.cache.set(cacheKey, result, 5 * 60 * 1000); // 5 minutes TTL
        }
        return result;
    }
    static async getFuelTypeById(fuelTypeId) {
        return await fuel_type_model_1.FuelType.findOne({ fuel_type_id: fuelTypeId, is_deleted: false });
    }
    static async getFuelTypeBySlug(slug) {
        return await fuel_type_model_1.FuelType.findOne({ slug, is_deleted: false });
    }
    static async createFuelType(fuelTypeData) {
        const fuel_type_id = (0, uuid_1.v4)();
        const slug = slug_util_1.SlugUtil.generate(fuelTypeData.name);
        const existingSlug = await fuel_type_model_1.FuelType.findOne({ slug, is_deleted: false });
        if (existingSlug) {
            const baseSlug = slug;
            const pattern = new RegExp(`^${baseSlug}(-\\d+)?$`);
            const matchingSlugs = (await fuel_type_model_1.FuelType.find({ slug: pattern, is_deleted: false }).select('slug').lean()).map((f) => f.slug);
            const uniqueSlug = slug_util_1.SlugUtil.generateUnique(fuelTypeData.name, matchingSlugs);
            fuelTypeData.slug = uniqueSlug;
        }
        else {
            fuelTypeData.slug = slug;
        }
        const fuelType = {
            fuel_type_id,
            name: fuelTypeData.name,
            slug: fuelTypeData.slug,
            description: fuelTypeData.description,
            is_published: fuelTypeData.is_published || false,
            is_featured: fuelTypeData.is_featured || false,
            is_deleted: false,
        };
        const result = await fuel_type_model_1.FuelType.create(fuelType);
        // Invalidate cache on create
        cache_util_1.cache.invalidatePattern('fueltypes:');
        return result;
    }
    static async updateFuelType(fuelTypeId, fuelTypeData) {
        const updateData = {};
        if (fuelTypeData.name !== undefined) {
            updateData.name = fuelTypeData.name;
            const newSlug = slug_util_1.SlugUtil.generate(fuelTypeData.name);
            const existingSlug = await fuel_type_model_1.FuelType.findOne({ slug: newSlug, fuel_type_id: { $ne: fuelTypeId }, is_deleted: false });
            if (!existingSlug) {
                updateData.slug = newSlug;
            }
        }
        if (fuelTypeData.description !== undefined)
            updateData.description = fuelTypeData.description;
        if (fuelTypeData.is_published !== undefined)
            updateData.is_published = fuelTypeData.is_published;
        if (fuelTypeData.is_featured !== undefined)
            updateData.is_featured = fuelTypeData.is_featured;
        const fuelType = await fuel_type_model_1.FuelType.findOneAndUpdate({ fuel_type_id: fuelTypeId, is_deleted: false }, updateData, { returnDocument: 'after' });
        if (!fuelType) {
            throw new app_error_util_1.AppError(`Fuel type not found or deleted for fuel_type_id: ${fuelTypeId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.FUEL_TYPE_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.FUEL_TYPE_NOT_FOUND,
                details: {
                    field: 'fuel_type_id',
                    reason: 'The fuel type does not exist or has been deleted.',
                },
            });
        }
        return fuelType;
    }
    static async deleteFuelType(fuelTypeId) {
        const fuelType = await fuel_type_model_1.FuelType.findOneAndUpdate({ fuel_type_id: fuelTypeId, is_deleted: false }, { is_deleted: true }, { returnDocument: 'after' });
        if (!fuelType) {
            throw new app_error_util_1.AppError(`Fuel type not found or deleted for fuel_type_id: ${fuelTypeId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.FUEL_TYPE_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.FUEL_TYPE_NOT_FOUND,
                details: {
                    field: 'fuel_type_id',
                    reason: 'The fuel type does not exist or has already been deleted.',
                },
            });
        }
        return fuelType;
    }
    static async restoreFuelType(fuelTypeId) {
        const fuelType = await fuel_type_model_1.FuelType.findOneAndUpdate({ fuel_type_id: fuelTypeId, is_deleted: true }, { is_deleted: false }, { returnDocument: 'after' });
        if (!fuelType) {
            throw new app_error_util_1.AppError(`Fuel type not found for fuel_type_id: ${fuelTypeId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.FUEL_TYPE_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.FUEL_TYPE_NOT_FOUND,
                details: {
                    field: 'fuel_type_id',
                    reason: 'The fuel type does not exist in the deleted records.',
                },
            });
        }
        return fuelType;
    }
    static async togglePublish(fuelTypeId) {
        const fuelType = await fuel_type_model_1.FuelType.findOne({ fuel_type_id: fuelTypeId, is_deleted: false });
        if (!fuelType) {
            throw new app_error_util_1.AppError(`Fuel type not found or deleted for fuel_type_id: ${fuelTypeId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.FUEL_TYPE_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.FUEL_TYPE_NOT_FOUND,
                details: {
                    field: 'fuel_type_id',
                    reason: 'The fuel type does not exist or has been deleted.',
                },
            });
        }
        fuelType.is_published = !fuelType.is_published;
        await fuelType.save();
        // Invalidate cache on publish toggle
        cache_util_1.cache.invalidatePattern('fueltypes:');
        return fuelType;
    }
}
exports.FuelTypeService = FuelTypeService;
//# sourceMappingURL=fuel-type.service.js.map