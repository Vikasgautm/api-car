"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarService = void 0;
const uuid_1 = require("uuid");
const body_type_model_1 = require("../../../models/body-type.model");
const brand_model_1 = require("../../../models/brand.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
const car_model_1 = require("../../../models/car.model");
const fuel_type_model_1 = require("../../../models/fuel-type.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const car_launch_status_util_1 = require("../../../shared/utils/car-launch-status.util");
const filter_util_1 = require("../../../shared/utils/filter.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const slug_util_1 = require("../../../shared/utils/slug.util");
class CarService {
    // static async getAllCars(filterDto: any, includeDeleted: boolean = false) {
    //   const {
    //     page = 1,
    //     limit = 10,
    //     q,
    //     brand_id,
    //     body_type_id,
    //     status,
    //     is_electric,
    //     is_published,
    //     is_featured,
    //     min_price,
    //     max_price,
    //     sortBy = 'name',
    //     sortOrder = 'asc',
    //   } = filterDto;
    //   console.log('getAllCars called with:', { filterDto, includeDeleted });
    //   const filter: Record<string, unknown> = {};
    //   if (!includeDeleted) {
    //     filter.is_deleted = false;
    //   }
    //   if (is_published !== undefined) {
    //     filter.is_published = is_published;
    //   }
    //   if (is_featured !== undefined) {
    //     filter.is_featured = is_featured;
    //   }
    //   if (brand_id !== undefined) {
    //     filter.brand_id = brand_id;
    //   }
    //   if (body_type_id !== undefined) {
    //     filter.body_type_id = body_type_id;
    //   }
    //   if (status !== undefined) {
    //     filter.status = status;
    //   }
    //   if (is_electric !== undefined) {
    //     filter.is_electric = is_electric;
    //   }
    //   // Price range filter (will be applied after fetching variants)
    //   const priceFilter: Record<string, unknown> = {};
    //   if (min_price !== undefined) {
    //     priceFilter.$gte = Number(min_price);
    //   }
    //   if (max_price !== undefined) {
    //     priceFilter.$lte = Number(max_price);
    //   }
    //   if (q) {
    //     const searchFilter = FilterUtil.buildSearchFilter(['name', 'short_description', 'description'], q);
    //     Object.assign(filter, searchFilter);
    //   }
    //   const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);
    //   const sortFilter = FilterUtil.buildSortFilter(sortBy, sortOrder);
    //   console.log(sortFilter, "sortfilter",validatedLimit, filter);
    //   let cars = await Car.find(filter)
    //     .populate("brand_id", "name slug")
    //     .populate("body_type_id", "name slug")
    //     .select('car_id name slug brand_id body_type_id short_description thumbnail status is_electric is_published is_featured meta_title meta_description')
    //     .sort(sortFilter)
    //     .skip(skip)
    //     .limit(validatedLimit)
    //     .lean();
    //   console.log(cars, "cars");
    //   // Apply price range filter by checking variants
    //   if (Object.keys(priceFilter).length > 0) {
    //     const carIds = (await CarVariant.find({
    //       $or: [
    //         { ex_showroom_price: priceFilter },
    //         { expected_price: priceFilter },
    //       ],
    //       is_deleted: false,
    //     }).distinct('car_id')).map(id => id.toString());
    //     cars = cars.filter((car: any) => carIds.includes(car.car_id.toString()));
    //   }
    //   const total = Object.keys(priceFilter).length > 0 
    //     ? cars.length 
    //     : await Car.countDocuments(filter);
    //   const paginationMeta = PaginationUtil.createPaginationMeta(page, validatedLimit, total);
    //   return { cars, pagination: paginationMeta };
    // }
    static async getAllCars(filterDto, includeDeleted = false) {
        try {
            const { page = 1, limit = 10, q, brand_id, body_type_id, fuel_type_id, status, is_electric, is_published, is_featured, is_popular, is_recommended, is_latest, top_selling, min_price, max_price, sortBy = 'name', sortOrder = 'asc', } = filterDto;
            const filter = {};
            if (!includeDeleted) {
                filter.is_deleted = false;
            }
            if (is_published !== undefined)
                filter.is_published = is_published;
            if (is_featured !== undefined)
                filter.is_featured = is_featured;
            if (is_popular !== undefined)
                filter.is_popular = is_popular;
            if (is_recommended !== undefined)
                filter.is_recommended = is_recommended;
            if (is_latest !== undefined)
                filter.is_latest = is_latest;
            if (top_selling !== undefined)
                filter.top_selling = top_selling;
            // Handle status filter with backward compatibility
            if (status !== undefined) {
                if (status === 'upcoming') {
                    filter.status = 'upcoming';
                    filter.is_upcoming = true;
                }
                else if (status === 'launched') {
                    filter.status = 'launched';
                    filter.is_upcoming = false;
                    filter.is_launched = true;
                }
                else if (status === 'discontinued') {
                    filter.status = 'discontinued';
                }
                else {
                    filter.status = status;
                }
            }
            if (brand_id !== undefined) {
                const brand = await brand_model_1.Brand.findOne({ brand_id, is_deleted: false });
                if (brand) {
                    filter.brand_id = brand_id;
                }
                else {
                    // If brand doesn't exist, return empty results
                    filter.brand_id = null;
                }
            }
            if (body_type_id !== undefined) {
                const bodyType = await body_type_model_1.BodyType.findOne({ body_type_id, is_deleted: false });
                if (bodyType) {
                    filter.body_type_id = body_type_id;
                }
                else {
                    // If body type doesn't exist, return empty results
                    filter.body_type_id = null;
                }
            }
            if (fuel_type_id !== undefined) {
                // Validate fuel_type_id format - reject invalid/corrupted values
                if (!fuel_type_id || typeof fuel_type_id !== 'string' || fuel_type_id.length < 1) {
                    throw new app_error_util_1.AppError('Invalid fuel_type_id parameter', 400);
                }
                const fuelTypeDoc = await fuel_type_model_1.FuelType.findOne({ fuel_type_id, is_deleted: false });
                if (fuelTypeDoc) {
                    filter.fuel_type_id = fuel_type_id;
                }
                else {
                    // If fuel type doesn't exist, return empty results
                    filter.fuel_type_id = null;
                }
            }
            if (is_electric !== undefined)
                filter.is_electric = is_electric;
            if (q) {
                const searchFilter = filter_util_1.FilterUtil.buildSearchFilter(['name', 'short_description', 'description'], q);
                Object.assign(filter, searchFilter);
            }
            const priceFilter = {};
            if (min_price !== undefined)
                priceFilter.$gte = Number(min_price);
            if (max_price !== undefined)
                priceFilter.$lte = Number(max_price);
            if (Object.keys(priceFilter).length > 0) {
                const matchingCarIds = await car_variant_model_1.CarVariant.find({
                    $or: [
                        { ex_showroom_price: priceFilter },
                        { expected_price: priceFilter },
                    ],
                    is_deleted: false,
                }).distinct('car_id');
                filter.car_id = { $in: matchingCarIds };
            }
            const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
            const sortFilter = filter_util_1.FilterUtil.buildSortFilter(sortBy, sortOrder);
            const [cars, total] = await Promise.all([
                car_model_1.Car.find(filter)
                    .select('car_id name slug brand_id body_type_id short_description thumbnail status is_upcoming is_launched expected_exshowroom_price expected_launch_date exshowroom_price is_electric is_published is_featured is_popular is_recommended is_latest top_selling meta_title meta_description')
                    .sort(sortFilter)
                    .skip(skip)
                    .limit(validatedLimit)
                    .lean(),
                car_model_1.Car.countDocuments(filter),
            ]);
            const paginationMeta = pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total);
            return { cars, pagination: paginationMeta };
        }
        catch (error) {
            console.log(error);
            throw new app_error_util_1.AppError('Failed to fetch cars', 500);
        }
    }
    static async getCarById(carId) {
        return await car_model_1.Car.findOne({ car_id: carId, is_deleted: false });
    }
    static async getCarBySlug(slug) {
        const car = await car_model_1.Car.findOne({ slug, is_deleted: false });
        if (!car)
            return null;
        const variants = await car_variant_model_1.CarVariant.find({
            car_id: car.car_id,
            is_published: true,
            is_deleted: false,
        });
        return { car, variants };
    }
    static async createCar(carData) {
        // Validate brand_id
        const brand = await brand_model_1.Brand.findOne({ brand_id: carData.brand_id, is_deleted: false });
        if (!brand) {
            throw new app_error_util_1.AppError('Brand not found', 404);
        }
        // Validate body_type_id
        const bodyType = await body_type_model_1.BodyType.findOne({ body_type_id: carData.body_type_id, is_deleted: false });
        if (!bodyType) {
            throw new app_error_util_1.AppError('Body type not found', 404);
        }
        // Validate fuel_type_id if provided
        if (carData.fuel_type_id) {
            const fuelType = await fuel_type_model_1.FuelType.findOne({ fuel_type_id: carData.fuel_type_id, is_deleted: false });
            if (!fuelType) {
                throw new app_error_util_1.AppError('Fuel type not found', 404);
            }
        }
        // Normalize launch status fields
        const normalizedData = (0, car_launch_status_util_1.normalizeCarLaunchStatus)(carData);
        const car_id = (0, uuid_1.v4)();
        const slug = slug_util_1.SlugUtil.generate(carData.name);
        const existingSlug = await car_model_1.Car.findOne({ slug, is_deleted: false });
        if (existingSlug) {
            const existingSlugs = (await car_model_1.Car.find({ is_deleted: false }).select('slug')).map(c => c.slug);
            const uniqueSlug = slug_util_1.SlugUtil.generateUnique(carData.name, existingSlugs);
            carData.slug = uniqueSlug;
        }
        else {
            carData.slug = slug;
        }
        const car = {
            car_id,
            name: carData.name,
            slug: carData.slug,
            brand_id: carData.brand_id,
            body_type_id: carData.body_type_id,
            fuel_type_id: carData.fuel_type_id,
            short_description: carData.short_description,
            description: carData.description,
            thumbnail: carData.thumbnail_url ? {
                url: carData.thumbnail_url,
                alt: carData.thumbnail_alt,
            } : undefined,
            images: carData.images,
            gallery_summary: carData.gallery_summary,
            status: normalizedData.status || 'launched',
            is_upcoming: normalizedData.is_upcoming || false,
            is_launched: normalizedData.is_launched !== undefined ? normalizedData.is_launched : true,
            expected_exshowroom_price: normalizedData.expected_exshowroom_price || null,
            expected_launch_date: normalizedData.expected_launch_date ? new Date(normalizedData.expected_launch_date) : null,
            exshowroom_price: normalizedData.exshowroom_price || null,
            is_electric: carData.is_electric || false,
            is_published: carData.is_published || false,
            is_featured: carData.is_featured || false,
            is_popular: carData.is_popular || false,
            is_recommended: carData.is_recommended || false,
            is_latest: carData.is_latest || false,
            top_selling: carData.top_selling || false,
            is_deleted: false,
            meta_title: carData.meta_title,
            meta_description: carData.meta_description,
            meta_keywords: carData.meta_keywords,
            og_image: carData.og_image,
            canonical_url: carData.canonical_url,
            noindex: carData.noindex,
        };
        return await car_model_1.Car.create(car);
    }
    static async updateCar(carId, carData) {
        const updateData = {};
        // Normalize launch status fields
        const normalizedData = (0, car_launch_status_util_1.normalizeCarLaunchStatus)(carData);
        // Validate relations if being updated
        if (carData.brand_id !== undefined) {
            const brand = await brand_model_1.Brand.findOne({ brand_id: carData.brand_id, is_deleted: false });
            if (!brand) {
                throw new app_error_util_1.AppError('Brand not found or deleted', 404);
            }
            updateData.brand_id = carData.brand_id;
        }
        if (carData.body_type_id !== undefined) {
            const bodyType = await body_type_model_1.BodyType.findOne({ body_type_id: carData.body_type_id, is_deleted: false });
            if (!bodyType) {
                throw new app_error_util_1.AppError('Body type not found or deleted', 404);
            }
            updateData.body_type_id = carData.body_type_id;
        }
        if (carData.fuel_type_id !== undefined) {
            if (carData.fuel_type_id) {
                const fuelTypeDoc = await fuel_type_model_1.FuelType.findOne({ fuel_type_id: carData.fuel_type_id, is_deleted: false });
                if (!fuelTypeDoc) {
                    throw new app_error_util_1.AppError('Fuel type not found or deleted', 404);
                }
            }
            updateData.fuel_type_id = carData.fuel_type_id;
        }
        if (carData.name !== undefined) {
            updateData.name = carData.name;
            const newSlug = slug_util_1.SlugUtil.generate(carData.name);
            const existingSlug = await car_model_1.Car.findOne({ slug: newSlug, car_id: { $ne: carId }, is_deleted: false });
            if (!existingSlug) {
                updateData.slug = newSlug;
            }
        }
        if (carData.short_description !== undefined)
            updateData.short_description = carData.short_description;
        if (carData.description !== undefined)
            updateData.description = carData.description;
        if (carData.thumbnail_url !== undefined) {
            updateData.thumbnail = {
                url: carData.thumbnail_url,
                alt: carData.thumbnail_alt,
            };
        }
        if (carData.images !== undefined)
            updateData.images = carData.images;
        if (carData.gallery_summary !== undefined)
            updateData.gallery_summary = carData.gallery_summary;
        // Handle launch status fields with normalization
        if (normalizedData.status !== undefined)
            updateData.status = normalizedData.status;
        if (normalizedData.is_upcoming !== undefined)
            updateData.is_upcoming = normalizedData.is_upcoming;
        if (normalizedData.is_launched !== undefined)
            updateData.is_launched = normalizedData.is_launched;
        if (normalizedData.expected_exshowroom_price !== undefined)
            updateData.expected_exshowroom_price = normalizedData.expected_exshowroom_price;
        if (normalizedData.expected_launch_date !== undefined)
            updateData.expected_launch_date = normalizedData.expected_launch_date === null ? null : (normalizedData.expected_launch_date instanceof Date ? normalizedData.expected_launch_date : new Date(normalizedData.expected_launch_date));
        if (normalizedData.exshowroom_price !== undefined)
            updateData.exshowroom_price = normalizedData.exshowroom_price;
        if (carData.is_electric !== undefined)
            updateData.is_electric = carData.is_electric;
        if (carData.is_published !== undefined)
            updateData.is_published = carData.is_published;
        if (carData.is_featured !== undefined)
            updateData.is_featured = carData.is_featured;
        if (carData.is_popular !== undefined)
            updateData.is_popular = carData.is_popular;
        if (carData.is_recommended !== undefined)
            updateData.is_recommended = carData.is_recommended;
        if (carData.is_latest !== undefined)
            updateData.is_latest = carData.is_latest;
        if (carData.top_selling !== undefined)
            updateData.top_selling = carData.top_selling;
        if (carData.meta_title !== undefined)
            updateData.meta_title = carData.meta_title;
        if (carData.meta_description !== undefined)
            updateData.meta_description = carData.meta_description;
        if (carData.meta_keywords !== undefined)
            updateData.meta_keywords = carData.meta_keywords;
        if (carData.og_image !== undefined)
            updateData.og_image = carData.og_image;
        if (carData.canonical_url !== undefined)
            updateData.canonical_url = carData.canonical_url;
        if (carData.noindex !== undefined)
            updateData.noindex = carData.noindex;
        const car = await car_model_1.Car.findOneAndUpdate({ car_id: carId, is_deleted: false }, updateData, { returnDocument: 'after' });
        if (!car) {
            throw new app_error_util_1.AppError('Car not found', 404);
        }
        return car;
    }
    static async deleteCar(carId) {
        const car = await car_model_1.Car.findOneAndUpdate({ car_id: carId, is_deleted: false }, { is_deleted: true }, { returnDocument: 'after' });
        if (!car) {
            throw new app_error_util_1.AppError('Car not found', 404);
        }
        return car;
    }
    static async restoreCar(carId) {
        const car = await car_model_1.Car.findOneAndUpdate({ car_id: carId, is_deleted: true }, { is_deleted: false }, { returnDocument: 'after' });
        if (!car) {
            throw new app_error_util_1.AppError('Car not found', 404);
        }
        return car;
    }
    static async togglePublish(carId) {
        const car = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false });
        if (!car) {
            throw new app_error_util_1.AppError('Car not found', 404);
        }
        car.is_published = !car.is_published;
        await car.save();
        return car;
    }
    static async markLaunched(carId) {
        const car = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false });
        if (!car) {
            throw new app_error_util_1.AppError('Car not found', 404);
        }
        const today = new Date();
        car.is_upcoming = false;
        car.is_launched = true;
        car.status = 'launched';
        car.is_latest = true;
        await car.save();
        return car;
    }
    static async markUpcoming(carId, data) {
        const car = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false });
        if (!car) {
            throw new app_error_util_1.AppError('Car not found', 404);
        }
        if (!data.expected_exshowroom_price || !data.expected_launch_date) {
            throw new app_error_util_1.AppError('expected_exshowroom_price and expected_launch_date are required for upcoming cars', 400);
        }
        car.is_upcoming = true;
        car.is_launched = false;
        car.status = 'upcoming';
        car.expected_exshowroom_price = data.expected_exshowroom_price;
        car.expected_launch_date = new Date(data.expected_launch_date);
        await car.save();
        return car;
    }
}
exports.CarService = CarService;
//# sourceMappingURL=car.service.js.map