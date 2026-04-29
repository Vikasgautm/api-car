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
        const { page = 1, limit = 10, q, state, is_published, is_featured, sortBy = 'name', sortOrder = 'asc' } = filterDto;
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
        return await city_model_1.City.findOne({ city_id: cityId, is_deleted: false });
    }
    static async getCityBySlug(slug) {
        return await city_model_1.City.findOne({ slug, is_deleted: false });
    }
    static async createCity(cityData) {
        const city_id = (0, uuid_1.v4)();
        const slug = slug_util_1.SlugUtil.generate(`${cityData.name}-${cityData.state}`);
        const existingSlug = await city_model_1.City.findOne({ slug, is_deleted: false });
        if (existingSlug) {
            const existingSlugs = (await city_model_1.City.find({ is_deleted: false }).select('slug')).map(c => c.slug);
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
            city_logo: cityData.city_logo,
            is_published: cityData.is_published || false,
            is_featured: cityData.is_featured || false,
            is_deleted: false,
            meta_title: cityData.meta_title,
            meta_description: cityData.meta_description,
            meta_keywords: cityData.meta_keywords,
            og_image: cityData.og_image,
            canonical_url: cityData.canonical_url,
            noindex: cityData.noindex,
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
            const existingSlug = await city_model_1.City.findOne({ slug: cityData.slug, city_id: { $ne: cityId }, is_deleted: false });
            if (!existingSlug) {
                updateData.slug = cityData.slug;
            }
        }
        else if (cityData.name !== undefined || cityData.state !== undefined) {
            const name = cityData.name || (await city_model_1.City.findOne({ city_id: cityId, is_deleted: false }))?.name;
            const state = cityData.state || (await city_model_1.City.findOne({ city_id: cityId, is_deleted: false }))?.state;
            if (name && state) {
                const newSlug = slug_util_1.SlugUtil.generate(`${name}-${state}`);
                const existingSlug = await city_model_1.City.findOne({ slug: newSlug, city_id: { $ne: cityId }, is_deleted: false });
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
        if (cityData.city_logo !== undefined)
            updateData.city_logo = cityData.city_logo;
        if (cityData.is_published !== undefined)
            updateData.is_published = cityData.is_published;
        if (cityData.is_featured !== undefined)
            updateData.is_featured = cityData.is_featured;
        if (cityData.meta_title !== undefined)
            updateData.meta_title = cityData.meta_title;
        if (cityData.meta_description !== undefined)
            updateData.meta_description = cityData.meta_description;
        if (cityData.meta_keywords !== undefined)
            updateData.meta_keywords = cityData.meta_keywords;
        if (cityData.og_image !== undefined)
            updateData.og_image = cityData.og_image;
        if (cityData.canonical_url !== undefined)
            updateData.canonical_url = cityData.canonical_url;
        if (cityData.noindex !== undefined)
            updateData.noindex = cityData.noindex;
        const city = await city_model_1.City.findOneAndUpdate({ city_id: cityId, is_deleted: false }, updateData, { returnDocument: 'after' });
        if (!city) {
            throw new app_error_util_1.AppError('City not found', 404);
        }
        return city;
    }
    static async deleteCity(cityId) {
        const city = await city_model_1.City.findOneAndUpdate({ city_id: cityId, is_deleted: false }, { is_deleted: true }, { returnDocument: 'after' });
        if (!city) {
            throw new app_error_util_1.AppError('City not found', 404);
        }
        return city;
    }
    static async restoreCity(cityId) {
        const city = await city_model_1.City.findOneAndUpdate({ city_id: cityId, is_deleted: true }, { is_deleted: false }, { returnDocument: 'after' });
        if (!city) {
            throw new app_error_util_1.AppError('City not found', 404);
        }
        return city;
    }
    static async togglePublish(cityId) {
        const city = await city_model_1.City.findOne({ city_id: cityId, is_deleted: false });
        if (!city) {
            throw new app_error_util_1.AppError('City not found', 404);
        }
        city.is_published = !city.is_published;
        await city.save();
        return city;
    }
}
exports.CityService = CityService;
//# sourceMappingURL=city.service.js.map