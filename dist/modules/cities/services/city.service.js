"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CityService = void 0;
const uuid_1 = require("uuid");
const city_model_1 = require("../../../models/city.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const filter_util_1 = require("../../../shared/utils/filter.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const slug_util_1 = require("../../../shared/utils/slug.util");
class CityService {
    static async getAllCities(filterDto, includeDeleted = false) {
        const { page = 1, limit = 10, q, state, is_deleted, sortBy = 'name', sortOrder = 'asc' } = filterDto;
        const filter = {};
        if (is_deleted === 'true' || is_deleted === true) {
            filter.is_deleted = true;
        }
        else if (!includeDeleted) {
            filter.is_deleted = false;
        }
        if (state !== undefined) {
            filter.state = state;
        }
        if (q) {
            const searchFilter = filter_util_1.FilterUtil.buildSearchFilter(['name', 'state'], q);
            Object.assign(filter, searchFilter);
        }
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const sortFilter = filter_util_1.FilterUtil.buildSortFilter(sortBy, sortOrder);
        const cities = await city_model_1.City.find(filter)
            .sort(sortFilter)
            .skip(skip)
            .limit(validatedLimit);
        const total = await city_model_1.City.countDocuments(filter);
        const paginationMeta = pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total);
        return { cities, pagination: paginationMeta };
    }
    static async getCityById(cityId) {
        return await city_model_1.City.findOne({ city_id: cityId });
    }
    static async getCityBySlug(slug) {
        return await city_model_1.City.findOne({ slug });
    }
    static async createCity(cityData) {
        const city_id = (0, uuid_1.v4)();
        const slug = slug_util_1.SlugUtil.generate(`${cityData.name}-${cityData.state}`);
        const existingSlug = await city_model_1.City.findOne({ slug });
        if (existingSlug) {
            const existingSlugs = (await city_model_1.City.find().select('slug')).map(c => c.slug);
            const uniqueSlug = slug_util_1.SlugUtil.generateUnique(`${cityData.name}-${cityData.state}`, existingSlugs);
            cityData.slug = uniqueSlug;
        }
        else {
            cityData.slug = slug;
        }
        const city = {
            city_id,
            name: cityData.name,
            slug: cityData.slug,
            state: cityData.state,
            country: cityData.country,
            pincode: cityData.pincode,
            longitude: cityData.longitude,
            latitude: cityData.latitude,
        };
        return await city_model_1.City.create(city);
    }
    static async updateCity(cityId, cityData) {
        const updateData = {};
        if (cityData.name !== undefined) {
            updateData.name = cityData.name;
        }
        if (cityData.state !== undefined) {
            updateData.state = cityData.state;
        }
        if (cityData.country !== undefined) {
            updateData.country = cityData.country;
        }
        if (cityData.slug !== undefined) {
            const existingSlug = await city_model_1.City.findOne({ slug: cityData.slug, city_id: { $ne: cityId } });
            if (!existingSlug) {
                updateData.slug = cityData.slug;
            }
        }
        else if (cityData.name !== undefined || cityData.state !== undefined) {
            const name = cityData.name || (await city_model_1.City.findOne({ city_id: cityId }))?.name;
            const state = cityData.state || (await city_model_1.City.findOne({ city_id: cityId }))?.state;
            if (name && state) {
                const newSlug = slug_util_1.SlugUtil.generate(`${name}-${state}`);
                const existingSlug = await city_model_1.City.findOne({ slug: newSlug, city_id: { $ne: cityId } });
                if (!existingSlug) {
                    updateData.slug = newSlug;
                }
            }
        }
        if (cityData.pincode !== undefined)
            updateData.pincode = cityData.pincode;
        if (cityData.longitude !== undefined)
            updateData.longitude = cityData.longitude;
        if (cityData.latitude !== undefined)
            updateData.latitude = cityData.latitude;
        const city = await city_model_1.City.findOneAndUpdate({ city_id: cityId }, updateData, { returnDocument: 'after' });
        if (!city) {
            throw new app_error_util_1.AppError('City not found', 404);
        }
        return city;
    }
    static async deleteCity(cityId) {
        const city = await city_model_1.City.findOneAndUpdate({ city_id: cityId, is_deleted: false }, { is_deleted: true, deleted_at: new Date() }, { returnDocument: 'after' });
        if (!city) {
            throw new app_error_util_1.AppError('City not found', 404);
        }
        return city;
    }
    static async restoreCity(cityId) {
        const city = await city_model_1.City.findOneAndUpdate({ city_id: cityId, is_deleted: true }, { is_deleted: false, deleted_at: null }, { returnDocument: 'after' });
        if (!city) {
            throw new app_error_util_1.AppError('City not found or not deleted', 404);
        }
        return city;
    }
}
exports.CityService = CityService;
//# sourceMappingURL=city.service.js.map