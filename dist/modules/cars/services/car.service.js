"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarService = void 0;
const uuid_1 = require("uuid");
const errorMessages_1 = require("../../../constants/errorMessages");
const body_type_model_1 = require("../../../models/body-type.model");
const brand_model_1 = require("../../../models/brand.model");
const car_image_model_1 = require("../../../models/car-image.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
const faq_model_1 = require("../../../models/faq.model");
const fuel_type_model_1 = require("../../../models/fuel-type.model");
const redirect_model_1 = require("../../../models/redirect.model");
const tag_model_1 = require("../../../models/tag.model");
const car_health_service_1 = require("../../../shared/services/car-health.service");
const car_aggregation_service_1 = require("../../../shared/services/car-aggregation.service");
const mileage_recompute_service_1 = require("../../../shared/services/mileage-recompute.service");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const audit_util_1 = require("../../../shared/utils/audit.util");
const car_launch_status_util_1 = require("../../../shared/utils/car-launch-status.util");
const filter_util_1 = require("../../../shared/utils/filter.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const slug_util_1 = require("../../../shared/utils/slug.util");
const car_model_1 = require("../../../models/car.model");
const tag_service_1 = require("../../taxonomy/services/tag.service");
class CarService {
    static async getAllCars(filterDto, includeDeleted = false) {
        try {
            const { page = 1, limit = 10, q, brand_id, body_type_id, fuel_type_id, status, is_electric, is_published, is_featured, is_popular, is_recommended, is_latest, top_selling, min_price, max_price, is_deleted, tag_ids, tag_slugs, mileage_class, range_class, model_family, is_current, sortBy = 'name', sortOrder = 'asc', } = filterDto;
            const filter = {};
            if (is_deleted === 'true' || is_deleted === true) {
                filter.is_deleted = true;
            }
            else if (!includeDeleted) {
                filter.is_deleted = false;
            }
            if (is_published !== undefined)
                filter.is_published = is_published;
            if (is_featured !== undefined)
                filter.is_featured = is_featured;
            // Public callers must never see archived / disabled cars even if a stale row
            // has is_published=true. Applied after the status branch below so a
            // `?status=archived` query from a public caller cannot bypass it.
            const isPublicListing = is_published === true || is_published === 'true';
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
            if (isPublicListing) {
                // Refuse archived/disabled — these are public-hidden no matter what the
                // status param requested above.
                if (filter.status && typeof filter.status === 'string' && (filter.status === 'archived' || filter.status === 'disabled')) {
                    // No public access to archived/disabled lists. Force an empty result.
                    filter.status = '__never_match__';
                }
                else if (!filter.status) {
                    filter.status = { $nin: ['archived', 'disabled'] };
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
            if (model_family !== undefined && typeof model_family === 'string' && model_family.trim() !== '') {
                filter.model_family = model_family.trim().toLowerCase();
            }
            if (is_current !== undefined) {
                filter.is_current = is_current === true || is_current === 'true';
            }
            // Tag filtering: accept either tag_ids (csv or array) or tag_slugs (csv or array).
            const requestedTagIds = Array.isArray(tag_ids)
                ? tag_ids.map(String).filter(Boolean)
                : typeof tag_ids === 'string' && tag_ids.length > 0
                    ? tag_ids.split(',').map(s => s.trim()).filter(Boolean)
                    : [];
            const requestedTagSlugs = Array.isArray(tag_slugs)
                ? tag_slugs.map(String).filter(Boolean)
                : typeof tag_slugs === 'string' && tag_slugs.length > 0
                    ? tag_slugs.split(',').map(s => s.trim()).filter(Boolean)
                    : [];
            if (requestedTagSlugs.length > 0) {
                const resolvedIds = await tag_model_1.Tag.find({
                    slug: { $in: requestedTagSlugs },
                    is_deleted: false,
                    is_published: true,
                }).distinct('tag_id');
                requestedTagIds.push(...resolvedIds);
            }
            if (requestedTagIds.length > 0) {
                filter.tag_ids = { $in: requestedTagIds };
            }
            const parseClassList = (input) => Array.isArray(input)
                ? input.map(String).filter(Boolean)
                : typeof input === 'string' && input.length > 0
                    ? input.split(',').map(s => s.trim()).filter(Boolean)
                    : [];
            const mileageClassValues = parseClassList(mileage_class);
            if (mileageClassValues.length > 0) {
                filter.best_mileage_class = { $in: mileageClassValues };
            }
            const rangeClassValues = parseClassList(range_class);
            if (rangeClassValues.length > 0) {
                filter.best_range_class = { $in: rangeClassValues };
            }
            if (q) {
                // Year-aware search: when the query contains a 4-digit year (e.g. "Creta 2022"),
                // map it onto the generation whose [start_year, end_year ?? this year] covers
                // that year. We don't carve separate pages for every calendar year — instead
                // the system surfaces the correct generation. The non-year tokens still feed
                // the regular text search.
                const yearMatch = String(q).match(/\b(19|20|21)\d{2}\b/);
                const stripped = yearMatch ? String(q).replace(yearMatch[0], '').trim() : String(q).trim();
                const andClauses = [];
                if (stripped) {
                    const searchFilter = filter_util_1.FilterUtil.buildSearchFilter(['name', 'short_description', 'description'], stripped);
                    if (searchFilter.$or)
                        andClauses.push({ $or: searchFilter.$or });
                }
                if (yearMatch) {
                    const year = Number(yearMatch[0]);
                    const thisYear = new Date().getFullYear();
                    andClauses.push({ generation_start_year: { $lte: year } });
                    andClauses.push({
                        $or: [
                            { generation_end_year: { $gte: year } },
                            // Open-ended generations (still current) — null end_year covers up
                            // through this year.
                            ...(year <= thisYear ? [{ generation_end_year: null }] : []),
                        ],
                    });
                }
                if (andClauses.length === 1) {
                    Object.assign(filter, andClauses[0]);
                }
                else if (andClauses.length > 1) {
                    filter.$and = andClauses;
                }
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
                    .select('car_id name slug brand_id body_type_id body_type_name short_description thumbnail status is_upcoming is_launched expected_exshowroom_price expected_launch_date exshowroom_price is_electric is_published is_featured is_popular is_recommended is_latest top_selling tag_ids best_mileage_class best_mileage_value best_range_class best_range_value variant_count incomplete_variant_count min_variant_price max_variant_price aggregated_fuel_types meta_title meta_description model_family generation_start_year generation_end_year generation_label is_current is_facelift')
                    .sort(sortFilter)
                    .skip(skip)
                    .limit(validatedLimit)
                    .lean(),
                car_model_1.Car.countDocuments(filter),
            ]);
            // Manual denormalisation: schema stores brand_id/body_type_id as plain strings
            // (no `ref`), so populate() is a no-op. Look them up in batch and merge.
            const brandIds = Array.from(new Set(cars.map((c) => c.brand_id).filter(Boolean)));
            const bodyTypeIds = Array.from(new Set(cars.map((c) => c.body_type_id).filter(Boolean)));
            const pageCarIds = cars.map((c) => c.car_id).filter(Boolean);
            const [brandDocs, bodyTypeDocs, faqCounts] = await Promise.all([
                brandIds.length > 0
                    ? brand_model_1.Brand.find({ brand_id: { $in: brandIds }, is_deleted: false })
                        .select('brand_id name slug')
                        .lean()
                    : Promise.resolve([]),
                bodyTypeIds.length > 0
                    ? body_type_model_1.BodyType.find({ body_type_id: { $in: bodyTypeIds }, is_deleted: false })
                        .select('body_type_id name slug')
                        .lean()
                    : Promise.resolve([]),
                car_health_service_1.CarHealthService.getFaqCountsByCar(pageCarIds),
            ]);
            const brandMap = new Map(brandDocs.map((b) => [b.brand_id, b]));
            const bodyTypeMap = new Map(bodyTypeDocs.map((bt) => [bt.body_type_id, bt]));
            const enrichedCars = cars.map((c) => {
                const health = car_health_service_1.CarHealthService.compute(c, faqCounts.get(c.car_id) ?? 0);
                return {
                    ...c,
                    brand: c.brand_id ? brandMap.get(c.brand_id) ?? null : null,
                    body_type: c.body_type_id ? bodyTypeMap.get(c.body_type_id) ?? null : null,
                    seo_health_issues: health.seo_health_issues,
                    completeness_score: health.completeness_score,
                    completeness_misses: health.completeness_misses,
                };
            });
            const paginationMeta = pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total);
            return { cars: enrichedCars, pagination: paginationMeta };
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
        const [variants, tags] = await Promise.all([
            car_variant_model_1.CarVariant.find({
                car_id: car.car_id,
                is_published: true,
                is_deleted: false,
            }),
            car.tag_ids && car.tag_ids.length > 0
                ? tag_model_1.Tag.find({
                    tag_id: { $in: car.tag_ids },
                    is_published: true,
                    is_deleted: false,
                }).lean()
                : Promise.resolve([]),
        ]);
        return { car, variants, tags };
    }
    static async createCar(carData, actor = null) {
        // Validate brand_id
        const brand = await brand_model_1.Brand.findOne({ brand_id: carData.brand_id, is_deleted: false });
        if (!brand) {
            throw new app_error_util_1.AppError(`Brand not found or deleted for brand_id: ${carData.brand_id}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BRAND_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BRAND_NOT_FOUND,
                details: {
                    field: 'brand_id',
                    reason: 'The selected brand does not exist, is deleted, or the wrong ID type was sent.',
                },
            });
        }
        // Validate body_type_id
        const bodyType = await body_type_model_1.BodyType.findOne({ body_type_id: carData.body_type_id, is_deleted: false });
        if (!bodyType) {
            throw new app_error_util_1.AppError(`Body type not found or deleted for body_type_id: ${carData.body_type_id}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BODY_TYPE_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BODY_TYPE_NOT_FOUND,
                details: {
                    field: 'body_type_id',
                    reason: 'The selected body type does not exist, is deleted, or the wrong ID type was sent.',
                },
            });
        }
        // Validate fuel_type_id if provided
        if (carData.fuel_type_id) {
            const fuelType = await fuel_type_model_1.FuelType.findOne({ fuel_type_id: carData.fuel_type_id, is_deleted: false });
            if (!fuelType) {
                throw new app_error_util_1.AppError(`Fuel type not found or deleted for fuel_type_id: ${carData.fuel_type_id}`, 404, {
                    userMessage: errorMessages_1.USER_MESSAGES.FUEL_TYPE_NOT_FOUND,
                    errorCode: errorMessages_1.ERROR_CODES.FUEL_TYPE_NOT_FOUND,
                    details: {
                        field: 'fuel_type_id',
                        reason: 'The selected fuel type does not exist, is deleted, or the wrong ID type was sent.',
                    },
                });
            }
        }
        // Normalize launch status fields
        const normalizedData = (0, car_launch_status_util_1.normalizeCarLaunchStatus)(carData);
        const car_id = (0, uuid_1.v4)();
        // Slug resolution: caller-provided slug HARD FAILS on collision (matches the
        // lifecycle locked decision — admin owns the SEO URL). Otherwise derive from
        // name, with auto-suffix on collision so create never silently breaks.
        if (typeof carData.slug === 'string' && carData.slug.trim() !== '') {
            const requestedSlug = carData.slug.trim().toLowerCase();
            if (!slug_util_1.SlugUtil.validate(requestedSlug)) {
                throw new app_error_util_1.AppError(`Invalid slug "${requestedSlug}". Use lowercase letters, digits, and hyphens only.`, 400);
            }
            const collidingCar = await car_model_1.Car.findOne({ slug: requestedSlug, is_deleted: false })
                .select('car_id name')
                .lean();
            if (collidingCar) {
                throw new app_error_util_1.AppError(`Slug "${requestedSlug}" is already in use by car "${collidingCar.name}" (${collidingCar.car_id}).`, 409);
            }
            carData.slug = requestedSlug;
        }
        else {
            const slug = slug_util_1.SlugUtil.generate(carData.name);
            const existingSlug = await car_model_1.Car.findOne({ slug, is_deleted: false });
            if (existingSlug) {
                const existingSlugs = (await car_model_1.Car.find({ is_deleted: false }).select('slug')).map((c) => c.slug);
                carData.slug = slug_util_1.SlugUtil.generateUnique(carData.name, existingSlugs);
            }
            else {
                carData.slug = slug;
            }
        }
        let resolvedTagIds = [];
        if (Array.isArray(carData.tag_ids) && carData.tag_ids.length > 0) {
            const { valid, invalid } = await tag_service_1.TagService.validateTagIds(carData.tag_ids);
            if (invalid.length > 0) {
                throw new app_error_util_1.AppError(`Unknown or deleted tag_id(s): ${invalid.join(', ')}`, 400, {
                    details: { field: 'tag_ids', invalid_ids: invalid },
                });
            }
            resolvedTagIds = valid;
        }
        const car = {
            car_id,
            name: carData.name,
            slug: carData.slug,
            brand_id: carData.brand_id,
            body_type_id: carData.body_type_id,
            // Denorm — already fetched above, store the name so cars can sort/group
            // by body type without a join.
            body_type_name: bodyType.name,
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
            tag_ids: resolvedTagIds,
            model_family: typeof carData.model_family === 'string' && carData.model_family.trim() !== ''
                ? carData.model_family.trim().toLowerCase()
                : null,
            generation_start_year: carData.generation_start_year ?? null,
            generation_end_year: carData.generation_end_year ?? null,
            generation_label: carData.generation_label ?? null,
            is_current: carData.is_current === true,
            is_facelift: carData.is_facelift === true,
            predecessor_car_id: carData.predecessor_car_id ?? null,
            successor_car_id: carData.successor_car_id ?? null,
            is_deleted: false,
            meta_title: carData.meta_title,
            meta_description: carData.meta_description,
            meta_keywords: carData.meta_keywords,
            og_image: carData.og_image,
            canonical_url: carData.canonical_url,
            noindex: carData.noindex,
        };
        let created;
        try {
            created = await car_model_1.Car.create(car);
        }
        catch (err) {
            if (err?.code === 11000 && err?.keyPattern?.is_current && car.model_family) {
                throw new app_error_util_1.AppError(`Another car in model_family "${car.model_family}" is already marked as current. Demote it first or use the Promote-to-current workflow.`, 409);
            }
            throw err;
        }
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'car',
            entity_id: created.car_id,
            action: 'create',
            actor,
            new_value: { car_id: created.car_id, name: created.name, slug: created.slug },
        });
        return created;
    }
    static async updateCar(carId, carData, actor = null) {
        const updateData = {};
        const before = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false }).lean();
        // Normalize launch status fields
        const normalizedData = (0, car_launch_status_util_1.normalizeCarLaunchStatus)(carData);
        // Validate relations if being updated
        if (carData.brand_id !== undefined) {
            const brand = await brand_model_1.Brand.findOne({ brand_id: carData.brand_id, is_deleted: false });
            if (!brand) {
                throw new app_error_util_1.AppError(`Brand not found or deleted for brand_id: ${carData.brand_id}`, 404, {
                    userMessage: errorMessages_1.USER_MESSAGES.BRAND_NOT_FOUND,
                    errorCode: errorMessages_1.ERROR_CODES.BRAND_NOT_FOUND,
                    details: {
                        field: 'brand_id',
                        reason: 'The selected brand does not exist, is deleted, or the wrong ID type was sent.',
                    },
                });
            }
            updateData.brand_id = carData.brand_id;
        }
        if (carData.body_type_id !== undefined) {
            const bodyType = await body_type_model_1.BodyType.findOne({ body_type_id: carData.body_type_id, is_deleted: false });
            if (!bodyType) {
                throw new app_error_util_1.AppError(`Body type not found or deleted for body_type_id: ${carData.body_type_id}`, 404, {
                    userMessage: errorMessages_1.USER_MESSAGES.BODY_TYPE_NOT_FOUND,
                    errorCode: errorMessages_1.ERROR_CODES.BODY_TYPE_NOT_FOUND,
                    details: {
                        field: 'body_type_id',
                        reason: 'The selected body type does not exist, is deleted, or the wrong ID type was sent.',
                    },
                });
            }
            updateData.body_type_id = carData.body_type_id;
            updateData.body_type_name = bodyType.name;
        }
        if (carData.fuel_type_id !== undefined) {
            if (carData.fuel_type_id) {
                const fuelTypeDoc = await fuel_type_model_1.FuelType.findOne({ fuel_type_id: carData.fuel_type_id, is_deleted: false });
                if (!fuelTypeDoc) {
                    throw new app_error_util_1.AppError(`Fuel type not found or deleted for fuel_type_id: ${carData.fuel_type_id}`, 404, {
                        userMessage: errorMessages_1.USER_MESSAGES.FUEL_TYPE_NOT_FOUND,
                        errorCode: errorMessages_1.ERROR_CODES.FUEL_TYPE_NOT_FOUND,
                        details: {
                            field: 'fuel_type_id',
                            reason: 'The selected fuel type does not exist, is deleted, or the wrong ID type was sent.',
                        },
                    });
                }
            }
            updateData.fuel_type_id = carData.fuel_type_id;
        }
        // Slug resolution order (locked behaviour from yesterday's lifecycle work):
        //   1. If the caller passed an explicit slug, validate uniqueness and HARD
        //      FAIL on collision — the admin is taking ownership of the SEO URL.
        //   2. Else if the name changed, regenerate from name and only adopt it if
        //      the regenerated slug is unused (silent skip preserves the existing
        //      slug, never auto-suffixes — same rule as Promote-to-current).
        if (carData.slug !== undefined && typeof carData.slug === 'string') {
            const requestedSlug = carData.slug.trim().toLowerCase();
            if (requestedSlug) {
                if (!slug_util_1.SlugUtil.validate(requestedSlug)) {
                    throw new app_error_util_1.AppError(`Invalid slug "${requestedSlug}". Use lowercase letters, digits, and hyphens only.`, 400);
                }
                const collidingCar = await car_model_1.Car.findOne({
                    slug: requestedSlug,
                    car_id: { $ne: carId },
                    is_deleted: false,
                }).select('car_id name').lean();
                if (collidingCar) {
                    throw new app_error_util_1.AppError(`Slug "${requestedSlug}" is already in use by car "${collidingCar.name}" (${collidingCar.car_id}). Pick a different slug or rename the other car.`, 409);
                }
                updateData.slug = requestedSlug;
            }
        }
        if (carData.name !== undefined) {
            updateData.name = carData.name;
            // Only auto-regenerate from name if the caller didn't already set the
            // slug explicitly above.
            if (updateData.slug === undefined) {
                const newSlug = slug_util_1.SlugUtil.generate(carData.name);
                const existingSlug = await car_model_1.Car.findOne({ slug: newSlug, car_id: { $ne: carId }, is_deleted: false });
                if (!existingSlug) {
                    updateData.slug = newSlug;
                }
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
        if (carData.editor_user_id !== undefined)
            updateData.editor_user_id = carData.editor_user_id || null;
        if (carData.seo_owner_user_id !== undefined)
            updateData.seo_owner_user_id = carData.seo_owner_user_id || null;
        if (carData.reviewer_user_id !== undefined)
            updateData.reviewer_user_id = carData.reviewer_user_id || null;
        if (carData.tag_ids !== undefined) {
            if (!Array.isArray(carData.tag_ids)) {
                throw new app_error_util_1.AppError('tag_ids must be an array of tag UUIDs', 400);
            }
            if (carData.tag_ids.length === 0) {
                updateData.tag_ids = [];
            }
            else {
                const { valid, invalid } = await tag_service_1.TagService.validateTagIds(carData.tag_ids);
                if (invalid.length > 0) {
                    throw new app_error_util_1.AppError(`Unknown or deleted tag_id(s): ${invalid.join(', ')}`, 400, {
                        details: { field: 'tag_ids', invalid_ids: invalid },
                    });
                }
                updateData.tag_ids = valid;
            }
        }
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
        // Generation / lifecycle fields
        if (carData.model_family !== undefined) {
            updateData.model_family = typeof carData.model_family === 'string' && carData.model_family.trim() !== ''
                ? carData.model_family.trim().toLowerCase()
                : null;
        }
        if (carData.generation_start_year !== undefined)
            updateData.generation_start_year = carData.generation_start_year;
        if (carData.generation_end_year !== undefined)
            updateData.generation_end_year = carData.generation_end_year;
        if (carData.generation_label !== undefined)
            updateData.generation_label = carData.generation_label;
        if (carData.is_current !== undefined)
            updateData.is_current = carData.is_current === true;
        if (carData.is_facelift !== undefined)
            updateData.is_facelift = carData.is_facelift === true;
        if (carData.predecessor_car_id !== undefined)
            updateData.predecessor_car_id = carData.predecessor_car_id || null;
        if (carData.successor_car_id !== undefined)
            updateData.successor_car_id = carData.successor_car_id || null;
        let car;
        try {
            car = await car_model_1.Car.findOneAndUpdate({ car_id: carId, is_deleted: false }, updateData, { returnDocument: 'after' });
        }
        catch (err) {
            if (err?.code === 11000 && err?.keyPattern?.is_current) {
                const family = updateData.model_family ?? before?.model_family ?? '(unknown)';
                throw new app_error_util_1.AppError(`Another car in model_family "${family}" is already marked as current. Demote it first or use the Promote-to-current workflow.`, 409);
            }
            throw err;
        }
        if (!car) {
            throw new app_error_util_1.AppError('Car not found', 404, {
                userMessage: errorMessages_1.USER_MESSAGES.CAR_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.CAR_NOT_FOUND,
                details: {
                    field: 'car_id',
                    reason: 'The car does not exist or has already been deleted.',
                },
            });
        }
        // Reclassify all variants when the inputs that drive classification change.
        if (carData.body_type_id !== undefined ||
            carData.fuel_type_id !== undefined ||
            carData.is_electric !== undefined) {
            await mileage_recompute_service_1.MileageRecomputeService.recomputeCar(car.car_id);
        }
        await audit_util_1.AuditUtil.recordChanges({
            entity_type: 'car',
            entity_id: car.car_id,
            before,
            after: car.toObject(),
            fieldsToTrack: audit_util_1.CAR_AUDIT_FIELDS,
            actor,
        });
        return car;
    }
    /**
     * Aggregate the set of related records / SEO surface area for a car.
     * Surfaced in the deletion dialog so an admin sees what they're about to
     * orphan before they OTP their way through a hard delete.
     *
     * inbound_redirects = Redirect rows pointing TO this car (deleting it would
     *   break those redirects' destinations). outbound_redirects = rows whose
     *   old_url is the car's own URL (typically created BY a prior promotion).
     */
    // One-shot maintenance: walk every non-deleted car and run the recompute hook.
    // Use after schema migrations that add new aggregate fields, or after bulk
    // variant imports that bypassed the per-write recompute hooks.
    // Also backfills body_type_name (denorm from BodyType) for any cars where
    // it's stale or missing — the recompute hook itself doesn't touch this field
    // because body_type_id changes are driven by car-edit writes, not variant writes.
    static async recomputeAggregatesAll() {
        const cars = await car_model_1.Car.find({ is_deleted: false }).select('car_id body_type_id').lean();
        // Batch-fetch all referenced body types so we don't N+1 the BodyType collection.
        const bodyTypeIds = Array.from(new Set(cars.map((c) => c.body_type_id).filter(Boolean)));
        const bodyTypeDocs = bodyTypeIds.length > 0
            ? await body_type_model_1.BodyType.find({ body_type_id: { $in: bodyTypeIds }, is_deleted: false })
                .select('body_type_id name')
                .lean()
            : [];
        const bodyTypeNameMap = new Map(bodyTypeDocs.map(bt => [bt.body_type_id, bt.name]));
        let recomputed = 0;
        let failed = 0;
        for (const c of cars) {
            try {
                await car_aggregation_service_1.CarAggregationService.recomputeFullAggregates(c.car_id);
                const nextBodyTypeName = c.body_type_id ? bodyTypeNameMap.get(c.body_type_id) ?? null : null;
                await car_model_1.Car.updateOne({ car_id: c.car_id }, { $set: { body_type_name: nextBodyTypeName } });
                recomputed++;
            }
            catch (err) {
                failed++;
                console.error(`recomputeAggregatesAll: failed for car_id=${c.car_id}`, err);
            }
        }
        return { scanned: cars.length, recomputed, failed };
    }
    /**
     * Single-car aggregate recompute — backs the "Recompute from variants" admin
     * button. Returns the computed snapshot so the UI can show what was written.
     */
    static async recomputeAggregatesForCar(carId) {
        const car = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false }).select('car_id').lean();
        if (!car)
            throw app_error_util_1.AppError.carNotFound(carId);
        const aggregates = await car_aggregation_service_1.CarAggregationService.recomputeFullAggregates(carId);
        return aggregates;
    }
    /**
     * Refine the car's AI intelligence flags using Claude Haiku 4.5.
     * Only flags whose rule confidence is below threshold are sent to the LLM —
     * unambiguous rule verdicts are kept as-is (saves tokens, avoids spurious flips).
     * Returns null if no ambiguous flags exist (no LLM call was made).
     */
    static async refineAiFlagsForCar(carId) {
        const car = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false }).select('car_id').lean();
        if (!car)
            throw app_error_util_1.AppError.carNotFound(carId);
        const { CarIntelligenceLLMService } = await Promise.resolve().then(() => __importStar(require('../../../shared/services/car-intelligence-llm.service')));
        return await CarIntelligenceLLMService.refineAmbiguousFlags(carId);
    }
    static async getDependencies(carId) {
        const car = await car_model_1.Car.findOne({ car_id: carId }).lean();
        if (!car)
            throw app_error_util_1.AppError.carNotFound(carId);
        const carUrl = `/cars/${car.slug}`;
        const [variants_count, images_count, faqs_count, inbound_redirects_count, outbound_redirects_count, sibling_generations_count,] = await Promise.all([
            car_variant_model_1.CarVariant.countDocuments({ car_id: carId, is_deleted: false }),
            car_image_model_1.CarImage.countDocuments({ car_id: carId, is_deleted: false }),
            faq_model_1.FAQ.countDocuments({ related_cars: carId, is_deleted: false }),
            redirect_model_1.Redirect.countDocuments({ new_url: carUrl, is_deleted: false }),
            redirect_model_1.Redirect.countDocuments({ old_url: carUrl, is_deleted: false }),
            car.model_family
                ? car_model_1.Car.countDocuments({
                    model_family: car.model_family,
                    car_id: { $ne: carId },
                    is_deleted: false,
                })
                : Promise.resolve(0),
        ]);
        const warnings = [];
        if (car.is_published) {
            warnings.push('Car is currently published — removing it will pull a live page from the site.');
        }
        if (car.is_current) {
            warnings.push('Car is marked as the CURRENT generation for its model_family. Demote or promote a replacement before deleting.');
        }
        if (inbound_redirects_count > 0) {
            warnings.push(`${inbound_redirects_count} redirect(s) point AT this car's URL. Deleting it leaves them pointing nowhere.`);
        }
        if (variants_count > 0) {
            warnings.push(`${variants_count} variant(s) belong to this car and will be orphaned.`);
        }
        return {
            car_id: car.car_id,
            name: car.name,
            slug: car.slug,
            is_published: !!car.is_published,
            is_current: !!car.is_current,
            status: car.status,
            model_family: car.model_family ?? null,
            counts: {
                variants: variants_count,
                images: images_count,
                faqs: faqs_count,
                inbound_redirects: inbound_redirects_count,
                outbound_redirects: outbound_redirects_count,
                sibling_generations: sibling_generations_count,
            },
            warnings,
        };
    }
    /**
     * Promote a car to be the current generation of its model_family.
     *
     * Atomicity: Mongo transactions aren't available on every topology, so we
     * run sequential writes and explicitly roll back the slugs we changed if a
     * later step fails. This is safer than partial state without a transaction —
     * the worst case (a crash mid-rollback) leaves the system in a state the
     * admin can manually correct, and we audit every step.
     *
     * Slug collisions hard-fail with a message naming the conflicting slug, per
     * the locked design — no auto-suffix, no silent retry.
     */
    static async promoteToCurrent(carId, input = {}, actor = null) {
        const incoming = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false }).lean();
        if (!incoming)
            throw app_error_util_1.AppError.carNotFound(carId);
        if (!incoming.model_family) {
            throw new app_error_util_1.AppError('Cannot promote: this car has no model_family set. Set it on the car first.', 400);
        }
        if (!incoming.generation_start_year) {
            throw new app_error_util_1.AppError('Cannot promote: this car has no generation_start_year set. The current generation needs a start year to derive the predecessor end year and archived slug.', 400);
        }
        if (incoming.is_current) {
            throw new app_error_util_1.AppError(`Car "${incoming.slug}" is already the current generation of "${incoming.model_family}". Nothing to promote.`, 409);
        }
        if (incoming.status === 'archived' || incoming.status === 'disabled') {
            throw new app_error_util_1.AppError(`Cannot promote a car with status "${incoming.status}". Restore it to launched or upcoming first.`, 409);
        }
        // Resolve the clean canonical slug. Default: {brand.slug}-{model_family}.
        let base_slug = (input.base_slug ?? '').trim().toLowerCase();
        if (!base_slug) {
            const brand = await brand_model_1.Brand.findOne({ brand_id: incoming.brand_id, is_deleted: false }).lean();
            if (!brand) {
                throw new app_error_util_1.AppError('Cannot derive base_slug — brand not found. Pass an explicit base_slug in the request body.', 400);
            }
            base_slug = `${brand.slug}-${incoming.model_family}`;
        }
        if (!/^[a-z0-9][a-z0-9-]*$/.test(base_slug)) {
            throw new app_error_util_1.AppError('base_slug must be a slug-style token (lowercase letters, digits, hyphens).', 400);
        }
        const outgoing = await car_model_1.Car.findOne({
            model_family: incoming.model_family,
            is_current: true,
            is_deleted: false,
            car_id: { $ne: incoming.car_id },
        }).lean();
        let outgoing_archived_slug = null;
        if (outgoing) {
            if (!outgoing.generation_start_year) {
                throw new app_error_util_1.AppError(`Cannot promote: the existing current generation "${outgoing.slug}" has no generation_start_year, so we can't derive its archived slug. Set it on that car first.`, 400);
            }
            outgoing_archived_slug = `${base_slug}-${outgoing.generation_start_year}`;
            const archivedClash = await car_model_1.Car.findOne({
                slug: outgoing_archived_slug,
                car_id: { $nin: [outgoing.car_id, incoming.car_id] },
                is_deleted: false,
            }).lean();
            if (archivedClash) {
                throw new app_error_util_1.AppError(`Cannot promote: "${outgoing_archived_slug}" is already in the database (car_id: ${archivedClash.car_id}). Resolve the conflict first.`, 409);
            }
        }
        const baseClash = await car_model_1.Car.findOne({
            slug: base_slug,
            car_id: { $nin: [incoming.car_id, outgoing?.car_id].filter(Boolean) },
            is_deleted: false,
        }).lean();
        if (baseClash) {
            throw new app_error_util_1.AppError(`Cannot promote: "${base_slug}" is already in the database (car_id: ${baseClash.car_id}). Resolve the conflict first.`, 409);
        }
        // Capture pre-state for rollback + audit.
        const original_incoming_slug = incoming.slug;
        const original_outgoing_slug = outgoing?.slug ?? null;
        const now = new Date();
        // Step 1 — demote the outgoing current (if any). Must run BEFORE step 2 or
        // the partial unique index will reject having two `is_current` rows.
        if (outgoing && outgoing_archived_slug) {
            const outgoingUpdate = {
                slug: outgoing_archived_slug,
                status: 'archived',
                is_current: false,
                archived_at: now,
                archived_by: actor?.user_id ?? null,
                generation_end_year: incoming.generation_start_year - 1,
                successor_car_id: incoming.car_id,
                // Backward-compat per-car 301 (the Redirect table is the new path,
                // but anything still reading redirect_to_slug keeps working).
                redirect_to_slug: base_slug,
            };
            try {
                await car_model_1.Car.findOneAndUpdate({ car_id: outgoing.car_id, is_deleted: false }, outgoingUpdate);
            }
            catch (err) {
                if (err?.code === 11000) {
                    throw new app_error_util_1.AppError(`Cannot promote: archived slug "${outgoing_archived_slug}" collides with an existing row. Resolve manually.`, 409);
                }
                throw err;
            }
        }
        // Step 2 — promote the incoming.
        const incomingUpdate = {
            slug: base_slug,
            status: 'launched',
            is_current: true,
            is_upcoming: false,
            is_launched: true,
            predecessor_car_id: outgoing?.car_id ?? null,
            // Clear any stale redirect that pointed elsewhere.
            redirect_to_slug: null,
        };
        let promoted;
        try {
            promoted = await car_model_1.Car.findOneAndUpdate({ car_id: incoming.car_id, is_deleted: false }, incomingUpdate, { returnDocument: 'after' });
        }
        catch (err) {
            // Rollback step 1.
            if (outgoing && original_outgoing_slug) {
                await car_model_1.Car.findOneAndUpdate({ car_id: outgoing.car_id }, {
                    slug: original_outgoing_slug,
                    status: outgoing.status,
                    is_current: true,
                    archived_at: outgoing.archived_at ?? null,
                    archived_by: outgoing.archived_by ?? null,
                    generation_end_year: outgoing.generation_end_year ?? null,
                    successor_car_id: outgoing.successor_car_id ?? null,
                    redirect_to_slug: outgoing.redirect_to_slug ?? null,
                }).catch(() => { });
            }
            if (err?.code === 11000) {
                throw new app_error_util_1.AppError(`Cannot promote: "${base_slug}" collides with an existing row. Resolve manually.`, 409);
            }
            throw err;
        }
        // Step 3 — write a Redirect row pointing the incoming's previous URL at
        // its new canonical URL, so anyone with a bookmark/backlink lands correctly.
        // Skip if the slug didn't change (admin promoted a car that was already at
        // the base slug) or if the slug ends up identical somehow.
        let redirect_created = false;
        if (original_incoming_slug && original_incoming_slug !== base_slug) {
            const old_url = `/cars/${original_incoming_slug}`;
            const new_url = `/cars/${base_slug}`;
            try {
                await redirect_model_1.Redirect.create({
                    redirect_id: (0, uuid_1.v4)(),
                    old_url,
                    new_url,
                    type: '301',
                    reason: input.reason
                        ? `Promoted to current — ${input.reason}`
                        : `Promoted ${incoming.car_id} to current generation`,
                    created_by: actor?.user_id ?? null,
                });
                redirect_created = true;
            }
            catch (err) {
                if (err?.code !== 11000)
                    throw err;
                // Already exists — leave the existing row alone (it might point at the
                // same destination already). Surfacing this in the audit event below.
            }
        }
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'car',
            entity_id: incoming.car_id,
            action: 'update',
            field: 'promote_to_current',
            old_value: {
                slug: original_incoming_slug,
                is_current: false,
                outgoing_car_id: outgoing?.car_id ?? null,
                outgoing_slug_was: original_outgoing_slug,
            },
            new_value: {
                slug: base_slug,
                is_current: true,
                model_family: incoming.model_family,
                outgoing_archived_as: outgoing_archived_slug,
                redirect_created,
                reason: input.reason ?? null,
            },
            actor,
        });
        return {
            promoted,
            outgoing: outgoing
                ? {
                    car_id: outgoing.car_id,
                    previous_slug: original_outgoing_slug,
                    archived_slug: outgoing_archived_slug,
                }
                : null,
            base_slug,
            redirect_created,
        };
    }
    static async deleteCar(carId, actor = null) {
        const car = await car_model_1.Car.findOneAndUpdate({ car_id: carId, is_deleted: false }, { is_deleted: true }, { returnDocument: 'after' });
        if (!car) {
            throw new app_error_util_1.AppError(`Car not found or deleted for car_id: ${carId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.CAR_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.CAR_NOT_FOUND,
                details: {
                    field: 'car_id',
                    reason: 'The car does not exist or has already been deleted.',
                },
            });
        }
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'car',
            entity_id: car.car_id,
            action: 'delete',
            actor,
        });
        return car;
    }
    static async restoreCar(carId, actor = null) {
        const car = await car_model_1.Car.findOneAndUpdate({ car_id: carId, is_deleted: true }, { is_deleted: false }, { returnDocument: 'after' });
        if (!car) {
            throw new app_error_util_1.AppError(`Car not found for car_id: ${carId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.CAR_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.CAR_NOT_FOUND,
                details: {
                    field: 'car_id',
                    reason: 'The car does not exist in the deleted records.',
                },
            });
        }
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'car',
            entity_id: car.car_id,
            action: 'restore',
            actor,
        });
        return car;
    }
    static async togglePublish(carId, actor = null) {
        const car = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false });
        if (!car) {
            throw new app_error_util_1.AppError(`Car not found or deleted for car_id: ${carId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.CAR_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.CAR_NOT_FOUND,
                details: {
                    field: 'car_id',
                    reason: 'The car does not exist or has been deleted.',
                },
            });
        }
        const previous = car.is_published;
        car.is_published = !car.is_published;
        await car.save();
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'car',
            entity_id: car.car_id,
            action: car.is_published ? 'publish' : 'unpublish',
            field: 'is_published',
            old_value: previous,
            new_value: car.is_published,
            actor,
        });
        return car;
    }
    static async markLaunched(carId, actor = null) {
        const car = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false });
        if (!car) {
            throw new app_error_util_1.AppError(`Car not found or deleted for car_id: ${carId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.CAR_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.CAR_NOT_FOUND,
                details: {
                    field: 'car_id',
                    reason: 'The car does not exist or has been deleted.',
                },
            });
        }
        const today = new Date();
        car.is_upcoming = false;
        car.is_launched = true;
        car.status = 'launched';
        car.is_latest = true;
        await car.save();
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'car',
            entity_id: car.car_id,
            action: 'mark_launched',
            new_value: { launched_at: today },
            actor,
        });
        return car;
    }
    static async markUpcoming(carId, data, actor = null) {
        const car = await car_model_1.Car.findOne({ car_id: carId, is_deleted: false });
        if (!car) {
            throw new app_error_util_1.AppError(`Car not found or deleted for car_id: ${carId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.CAR_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.CAR_NOT_FOUND,
                details: {
                    field: 'car_id',
                    reason: 'The car does not exist or has been deleted.',
                },
            });
        }
        if (!data.expected_exshowroom_price || !data.expected_launch_date) {
            throw new app_error_util_1.AppError('expected_exshowroom_price and expected_launch_date are required for upcoming cars', 400, {
                userMessage: errorMessages_1.USER_MESSAGES.VALIDATION_ERROR,
                errorCode: errorMessages_1.ERROR_CODES.VALIDATION_ERROR,
                details: {
                    fields: {
                        expected_exshowroom_price: 'Expected ex-showroom price is required for upcoming cars.',
                        expected_launch_date: 'Expected launch date is required for upcoming cars.',
                    },
                },
            });
        }
        car.is_upcoming = true;
        car.is_launched = false;
        car.status = 'upcoming';
        car.expected_exshowroom_price = data.expected_exshowroom_price;
        car.expected_launch_date = new Date(data.expected_launch_date);
        await car.save();
        await audit_util_1.AuditUtil.recordEvent({
            entity_type: 'car',
            entity_id: car.car_id,
            action: 'mark_upcoming',
            new_value: {
                expected_exshowroom_price: data.expected_exshowroom_price,
                expected_launch_date: data.expected_launch_date,
            },
            actor,
        });
        return car;
    }
}
exports.CarService = CarService;
//# sourceMappingURL=car.service.js.map