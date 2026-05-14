"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscoveryService = void 0;
const body_type_model_1 = require("../../../models/body-type.model");
const brand_model_1 = require("../../../models/brand.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
const car_model_1 = require("../../../models/car.model");
const fuel_type_model_1 = require("../../../models/fuel-type.model");
const tag_model_1 = require("../../../models/tag.model");
const tag_category_model_1 = require("../../../models/tag-category.model");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
function csvToArray(input) {
    if (Array.isArray(input))
        return input.map(String).map(s => s.trim()).filter(Boolean);
    if (typeof input === 'string' && input.length > 0)
        return input.split(',').map(s => s.trim()).filter(Boolean);
    return [];
}
function parseBoolean(input) {
    if (input === undefined || input === null || input === '')
        return undefined;
    if (typeof input === 'boolean')
        return input;
    if (typeof input === 'string') {
        if (input === 'true' || input === '1')
            return true;
        if (input === 'false' || input === '0')
            return false;
    }
    return undefined;
}
function parseNumber(input) {
    if (input === undefined || input === null || input === '')
        return undefined;
    const n = typeof input === 'number' ? input : Number(input);
    return Number.isFinite(n) ? n : undefined;
}
class DiscoveryService {
    /**
     * Resolve the public-facing filter shape (slugs, csvs, etc.) into the
     * concrete id/value shape used by the Car/CarVariant queries. Done once per
     * request because every facet count re-uses the resolved set.
     */
    static async resolveFilters(filters) {
        const brandSlugs = csvToArray(filters.brand_slugs);
        const bodyTypeSlugs = csvToArray(filters.body_type_slugs);
        const fuelTypeSlugs = csvToArray(filters.fuel_type_slugs);
        const tagSlugs = csvToArray(filters.tags);
        const intentSlugs = csvToArray(filters.intent);
        const tagMatchMode = filters.tags_mode === 'all' ? 'all' : 'any';
        const [brands, bodyTypes, fuelTypes, namedTags, intentCategory] = await Promise.all([
            brandSlugs.length ? brand_model_1.Brand.find({ slug: { $in: brandSlugs }, is_deleted: false }).select('brand_id').lean() : Promise.resolve([]),
            bodyTypeSlugs.length ? body_type_model_1.BodyType.find({ slug: { $in: bodyTypeSlugs }, is_deleted: false }).select('body_type_id').lean() : Promise.resolve([]),
            fuelTypeSlugs.length ? fuel_type_model_1.FuelType.find({ slug: { $in: fuelTypeSlugs }, is_deleted: false }).select('fuel_type_id').lean() : Promise.resolve([]),
            tagSlugs.length ? tag_model_1.Tag.find({ slug: { $in: tagSlugs }, is_deleted: false, is_published: true }).select('tag_id').lean() : Promise.resolve([]),
            intentSlugs.length ? tag_category_model_1.TagCategory.findOne({ type: 'intent', is_deleted: false, is_published: true }).select('tag_category_id').lean() : Promise.resolve(null),
        ]);
        const tagIds = namedTags.map(t => t.tag_id);
        if (intentSlugs.length && intentCategory) {
            const intentTags = await tag_model_1.Tag.find({
                slug: { $in: intentSlugs },
                tag_category_id: intentCategory.tag_category_id,
                is_deleted: false,
                is_published: true,
            }).select('tag_id').lean();
            tagIds.push(...intentTags.map(t => t.tag_id));
        }
        const statuses = csvToArray(filters.status);
        const showHidden = statuses.includes('archived') || statuses.includes('disabled');
        const transmissionsRaw = csvToArray(filters.transmission).map(s => s.toLowerCase());
        const allowedTransmissions = new Set(['manual', 'automatic', 'cvt', 'dct', 'amt']);
        const transmissions = transmissionsRaw.filter(t => allowedTransmissions.has(t));
        const mileageClassRaw = csvToArray(filters.mileage_class);
        const allowedClasses = new Set(['weak', 'average', 'good', 'excellent']);
        const mileage_class = mileageClassRaw.filter(c => allowedClasses.has(c));
        const range_class = csvToArray(filters.range_class).filter(c => allowedClasses.has(c));
        return {
            q: filters.q,
            tag_ids: Array.from(new Set(tagIds)),
            tag_match_mode: tagMatchMode,
            brand_ids: brands.map(b => b.brand_id),
            body_type_ids: bodyTypes.map(b => b.body_type_id),
            fuel_type_ids: fuelTypes.map(f => f.fuel_type_id),
            min_price: parseNumber(filters.min_price),
            max_price: parseNumber(filters.max_price),
            seating_min: parseNumber(filters.seating_min),
            seating_max: parseNumber(filters.seating_max),
            transmissions,
            safety_min_airbags: parseNumber(filters.safety_min_airbags),
            adas: parseBoolean(filters.adas),
            mileage_class,
            range_class,
            statuses,
            is_electric: parseBoolean(filters.is_electric),
            show_hidden_statuses: showHidden,
        };
    }
    /**
     * Filter variants by the variant-level dimensions (price, transmission,
     * seating, safety, adas) and return the distinct car_ids they belong to.
     * Returns null when the caller passed no variant-level filters, so callers can
     * skip the secondary query entirely.
     */
    static async getCarIdsFromVariantFilters(resolved) {
        const hasPrice = resolved.min_price !== undefined || resolved.max_price !== undefined;
        const hasSeating = resolved.seating_min !== undefined || resolved.seating_max !== undefined;
        const hasTransmission = resolved.transmissions.length > 0;
        const hasSafety = resolved.safety_min_airbags !== undefined;
        const hasAdas = resolved.adas !== undefined;
        if (!hasPrice && !hasSeating && !hasTransmission && !hasSafety && !hasAdas) {
            return null;
        }
        const filter = {
            is_deleted: false,
            is_archived: false,
        };
        if (hasPrice) {
            const range = {};
            if (resolved.min_price !== undefined)
                range.$gte = resolved.min_price;
            if (resolved.max_price !== undefined)
                range.$lte = resolved.max_price;
            filter.$or = [
                { ex_showroom_price: range },
                { expected_price: range },
            ];
        }
        if (hasSeating) {
            const range = {};
            if (resolved.seating_min !== undefined)
                range.$gte = resolved.seating_min;
            if (resolved.seating_max !== undefined)
                range.$lte = resolved.seating_max;
            filter.seating_capacity = range;
        }
        if (hasTransmission) {
            filter.transmission_type = { $in: resolved.transmissions };
        }
        if (hasSafety) {
            filter['specs_normalized.safety.airbags'] = { $gte: resolved.safety_min_airbags };
        }
        if (hasAdas !== undefined && resolved.adas !== undefined) {
            // ADAS "yes" → at least one ADAS field is truthy. We approximate this with
            // adaptive_cruise_control || lane_keep_assist (the spec's two strongest signals).
            if (resolved.adas) {
                filter['$or'] = [
                    ...(Array.isArray(filter['$or']) ? filter['$or'] : []),
                    { 'specs_normalized.adas.adaptive_cruise_control': true },
                    { 'specs_normalized.adas.lane_keep_assist': true },
                    { 'specs_normalized.adas.automatic_emergency_braking': true },
                ];
            }
        }
        return car_variant_model_1.CarVariant.find(filter).distinct('car_id');
    }
    /**
     * Apply the car-level filters, returning the Mongo filter object.
     * `excludeDimension` lets the facet pipeline drop one dimension at a time so
     * each facet's counts reflect *everything except* that dimension.
     */
    static buildCarFilter(resolved, variantMatchedCarIds, excludeDimension) {
        const filter = {
            is_deleted: false,
        };
        // Default to public-visible cars unless the caller asked for hidden statuses.
        if (resolved.statuses.length > 0) {
            filter.status = { $in: resolved.statuses };
        }
        else if (!resolved.show_hidden_statuses) {
            filter.status = { $nin: ['archived', 'disabled'] };
            // Public discovery should also be published only.
            filter.is_published = true;
        }
        if (resolved.q) {
            const safe = resolved.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.$and = [
                ...(Array.isArray(filter.$and) ? filter.$and : []),
                { $or: [{ name: { $regex: safe, $options: 'i' } }, { short_description: { $regex: safe, $options: 'i' } }] },
            ];
        }
        if (excludeDimension !== 'brand' && resolved.brand_ids.length > 0) {
            filter.brand_id = { $in: resolved.brand_ids };
        }
        if (excludeDimension !== 'body_type' && resolved.body_type_ids.length > 0) {
            filter.body_type_id = { $in: resolved.body_type_ids };
        }
        if (excludeDimension !== 'fuel_type' && resolved.fuel_type_ids.length > 0) {
            filter.fuel_type_id = { $in: resolved.fuel_type_ids };
        }
        if (excludeDimension !== 'mileage_class' && resolved.mileage_class.length > 0) {
            filter.best_mileage_class = { $in: resolved.mileage_class };
        }
        if (excludeDimension !== 'range_class' && resolved.range_class.length > 0) {
            filter.best_range_class = { $in: resolved.range_class };
        }
        if (excludeDimension !== 'is_electric' && resolved.is_electric !== undefined) {
            filter.is_electric = resolved.is_electric;
        }
        if (excludeDimension !== 'tags' && resolved.tag_ids.length > 0) {
            if (resolved.tag_match_mode === 'all') {
                filter.tag_ids = { $all: resolved.tag_ids };
            }
            else {
                filter.tag_ids = { $in: resolved.tag_ids };
            }
        }
        if (variantMatchedCarIds !== null) {
            filter.car_id = { $in: variantMatchedCarIds };
        }
        return filter;
    }
    static getSortClause(sortBy) {
        switch (sortBy) {
            case 'price_asc':
                // Cars store exshowroom_price for launched, expected_exshowroom_price for upcoming.
                // Mongo doesn't have a built-in coalesce in sort, so we sort by exshowroom_price
                // ascending and let documents without it land at the top with $exists handling
                // elsewhere — but for first cut, prefer the launched price column.
                return { exshowroom_price: 1, expected_exshowroom_price: 1 };
            case 'price_desc':
                return { exshowroom_price: -1, expected_exshowroom_price: -1 };
            case 'mileage':
                return { best_mileage_value: -1 };
            case 'range':
                return { best_range_value: -1 };
            case 'popularity':
                return { is_popular: -1, is_featured: -1, is_latest: -1, createdAt: -1 };
            case 'newest':
                return { createdAt: -1 };
            case 'name':
            default:
                return { name: 1 };
        }
    }
    /** Full discovery query: list + pagination + facet counts. */
    static async discover(filters) {
        const resolved = await this.resolveFilters(filters);
        const variantMatchedCarIds = await this.getCarIdsFromVariantFilters(resolved);
        // Fast-fail: variant filters were given but matched nothing → empty result.
        if (variantMatchedCarIds !== null && variantMatchedCarIds.length === 0) {
            return {
                cars: [],
                pagination: pagination_util_1.PaginationUtil.createPaginationMeta(1, 0, 0),
                facets: {
                    brand: [],
                    body_type: [],
                    fuel_type: [],
                    status: [],
                    mileage_class: [],
                    range_class: [],
                    is_electric: [],
                    tags: [],
                },
                applied: resolved,
            };
        }
        const carFilter = this.buildCarFilter(resolved, variantMatchedCarIds);
        const pageNum = parseNumber(filters.page) ?? 1;
        const limitNum = parseNumber(filters.limit) ?? 10;
        const { skip, limit } = pagination_util_1.PaginationUtil.getPaginationParams(pageNum, limitNum);
        const sort = this.getSortClause(filters.sortBy);
        const [cars, total, facets] = await Promise.all([
            car_model_1.Car.find(carFilter)
                .select('car_id name slug brand_id body_type_id fuel_type_id short_description thumbnail status ' +
                'is_upcoming is_launched expected_exshowroom_price exshowroom_price is_electric ' +
                'is_published is_featured is_popular is_recommended is_latest top_selling tag_ids ' +
                'best_mileage_class best_mileage_value best_range_class best_range_value ' +
                'redirect_to_slug archived_at disabled_at discontinued_at meta_title meta_description')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            car_model_1.Car.countDocuments(carFilter),
            this.buildFacets(resolved, variantMatchedCarIds),
        ]);
        return {
            cars,
            pagination: pagination_util_1.PaginationUtil.createPaginationMeta(pageNum, limit, total),
            facets,
            applied: resolved,
        };
    }
    /**
     * Build the facet count breakdowns. Each dimension is counted using the same
     * filter as the main query, minus that dimension — standard faceted search.
     */
    static async buildFacets(resolved, variantMatchedCarIds) {
        const dims = [
            { key: 'brand', groupBy: '$brand_id' },
            { key: 'body_type', groupBy: '$body_type_id' },
            { key: 'fuel_type', groupBy: '$fuel_type_id' },
            { key: 'status', groupBy: '$status' },
            { key: 'mileage_class', groupBy: '$best_mileage_class' },
            { key: 'range_class', groupBy: '$best_range_class' },
            { key: 'is_electric', groupBy: '$is_electric' },
            { key: 'tags', groupBy: '$tag_ids', unwind: '$tag_ids' },
        ];
        const out = {
            brand: [],
            body_type: [],
            fuel_type: [],
            status: [],
            mileage_class: [],
            range_class: [],
            is_electric: [],
            tags: [],
        };
        await Promise.all(dims.map(async (dim) => {
            const facetFilter = this.buildCarFilter(resolved, variantMatchedCarIds, dim.key);
            const pipeline = [{ $match: facetFilter }];
            if (dim.unwind)
                pipeline.push({ $unwind: dim.unwind });
            pipeline.push({ $group: { _id: dim.groupBy, count: { $sum: 1 } } });
            pipeline.push({ $sort: { count: -1 } });
            pipeline.push({ $limit: 50 });
            const rows = await car_model_1.Car.aggregate(pipeline);
            out[dim.key] = rows
                .filter(r => r._id !== null && r._id !== undefined && r._id !== '')
                .map(r => ({ value: String(r._id), count: r.count }));
        }));
        // Hydrate display labels for the slug-based facets so the frontend doesn't
        // have to re-query lookup tables.
        const [brands, bodyTypes, fuelTypes, tags] = await Promise.all([
            out.brand.length ? brand_model_1.Brand.find({ brand_id: { $in: out.brand.map(b => b.value) } }).select('brand_id name slug').lean() : Promise.resolve([]),
            out.body_type.length ? body_type_model_1.BodyType.find({ body_type_id: { $in: out.body_type.map(b => b.value) } }).select('body_type_id name slug').lean() : Promise.resolve([]),
            out.fuel_type.length ? fuel_type_model_1.FuelType.find({ fuel_type_id: { $in: out.fuel_type.map(b => b.value) } }).select('fuel_type_id name slug').lean() : Promise.resolve([]),
            out.tags.length ? tag_model_1.Tag.find({ tag_id: { $in: out.tags.map(t => t.value) } }).select('tag_id name slug').lean() : Promise.resolve([]),
        ]);
        const brandById = new Map(brands.map((b) => [b.brand_id, { name: b.name, slug: b.slug }]));
        const bodyTypeById = new Map(bodyTypes.map((b) => [b.body_type_id, { name: b.name, slug: b.slug }]));
        const fuelTypeById = new Map(fuelTypes.map((f) => [f.fuel_type_id, { name: f.name, slug: f.slug }]));
        const tagById = new Map(tags.map((t) => [t.tag_id, { name: t.name, slug: t.slug }]));
        out.brand = out.brand.map(f => ({ ...f, label: brandById.get(f.value)?.name, value: brandById.get(f.value)?.slug ?? f.value }));
        out.body_type = out.body_type.map(f => ({ ...f, label: bodyTypeById.get(f.value)?.name, value: bodyTypeById.get(f.value)?.slug ?? f.value }));
        out.fuel_type = out.fuel_type.map(f => ({ ...f, label: fuelTypeById.get(f.value)?.name, value: fuelTypeById.get(f.value)?.slug ?? f.value }));
        out.tags = out.tags.map(f => ({ ...f, label: tagById.get(f.value)?.name, value: tagById.get(f.value)?.slug ?? f.value }));
        return out;
    }
    /** Lightweight count-only call used by SEO preset preview. */
    static async count(filters) {
        const resolved = await this.resolveFilters(filters);
        const variantMatchedCarIds = await this.getCarIdsFromVariantFilters(resolved);
        if (variantMatchedCarIds !== null && variantMatchedCarIds.length === 0)
            return 0;
        const carFilter = this.buildCarFilter(resolved, variantMatchedCarIds);
        return car_model_1.Car.countDocuments(carFilter);
    }
}
exports.DiscoveryService = DiscoveryService;
//# sourceMappingURL=discovery.service.js.map