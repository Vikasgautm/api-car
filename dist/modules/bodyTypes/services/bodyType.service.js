"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyTypeService = void 0;
const uuid_1 = require("uuid");
const errorMessages_1 = require("../../../constants/errorMessages");
const body_type_model_1 = require("../../../models/body-type.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
const car_model_1 = require("../../../models/car.model");
const seo_collection_model_1 = require("../../../models/seo-collection.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const filter_util_1 = require("../../../shared/utils/filter.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const slug_util_1 = require("../../../shared/utils/slug.util");
const cache_util_1 = require("../../../utils/cache.util");
const SEO_FIELDS = ['slug', 'seo_title', 'meta_description', 'intro_content', 'short_description', 'hero_image'];
function computeSeoCompleteness(bt) {
    const missing = [];
    if (!bt.slug)
        missing.push('slug');
    if (!bt.seo_title)
        missing.push('seo_title');
    if (!bt.meta_description)
        missing.push('meta_description');
    if (!bt.intro_content)
        missing.push('intro_content');
    if (!bt.short_description)
        missing.push('short_description');
    if (!bt.hero_image?.url)
        missing.push('hero_image');
    const score = Math.round(((SEO_FIELDS.length - missing.length) / SEO_FIELDS.length) * 100);
    return { score, missing };
}
class BodyTypeService {
    static async getAllBodyTypes(filterDto, includeDeleted = false) {
        const { page = 1, limit = 10, q, is_published, is_featured, is_deleted, has_cars, missing_seo, parent_only, child_only, sortBy = 'sort_order', sortOrder = 'asc', } = filterDto;
        // Only cache simple published queries without complex filters
        const isSimpleQuery = !q && !is_featured && !has_cars && !missing_seo && !parent_only && !child_only && page === 1 && limit === 10 && is_published === 'true' && !includeDeleted;
        const cacheKey = cache_util_1.CacheKeys.bodyType.all({ is_published: true, page: 1, limit: 10 });
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
        if (is_published !== undefined && is_published !== '') {
            filter.is_published = is_published === 'true' || is_published === true;
        }
        if (is_featured !== undefined && is_featured !== '') {
            filter.is_featured = is_featured === 'true' || is_featured === true;
        }
        if (parent_only === 'true') {
            filter.$or = [{ parent_id: null }, { parent_id: { $exists: false } }];
        }
        if (child_only === 'true') {
            filter.parent_id = { $ne: null, $exists: true, $gt: '' };
        }
        if (missing_seo === 'true') {
            filter.$or = [
                { seo_title: { $in: [null, ''] } },
                { meta_description: { $in: [null, ''] } },
                { intro_content: { $in: [null, ''] } },
                { short_description: { $in: [null, ''] } },
                { 'hero_image.url': { $in: [null, ''] } },
                { hero_image: { $exists: false } },
            ];
        }
        if (q) {
            const searchFilter = filter_util_1.FilterUtil.buildSearchFilter(['name', 'description', 'seo_title'], q);
            Object.assign(filter, searchFilter);
        }
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const sortFilter = filter_util_1.FilterUtil.buildSortFilter(sortBy, sortOrder);
        let bodyTypeIds = null;
        // Filter by has_cars / without_cars
        if (has_cars === 'true' || has_cars === 'false') {
            const carBodyTypeIds = await car_model_1.Car.distinct('body_type_id', { is_deleted: false });
            if (has_cars === 'true') {
                filter.body_type_id = { $in: carBodyTypeIds };
            }
            else {
                filter.body_type_id = { $nin: carBodyTypeIds };
            }
        }
        const [bodyTypesRaw, total] = await Promise.all([
            body_type_model_1.BodyType.find(filter).sort(sortFilter).skip(skip).limit(validatedLimit).lean(),
            body_type_model_1.BodyType.countDocuments(filter),
        ]);
        bodyTypeIds = bodyTypesRaw.map((bt) => bt.body_type_id);
        // Fetch car counts and variant counts in batch
        const [carCountsRaw, variantCountsRaw, seoCountsRaw] = await Promise.all([
            car_model_1.Car.aggregate([
                { $match: { body_type_id: { $in: bodyTypeIds }, is_deleted: false } },
                { $group: { _id: '$body_type_id', count: { $sum: 1 } } },
            ]),
            car_model_1.Car.aggregate([
                { $match: { body_type_id: { $in: bodyTypeIds }, is_deleted: false } },
                {
                    $lookup: {
                        from: 'carvariants',
                        localField: 'car_id',
                        foreignField: 'car_id',
                        as: 'variants',
                    },
                },
                { $group: { _id: '$body_type_id', count: { $sum: { $size: '$variants' } } } },
            ]),
            seo_collection_model_1.SeoCollection.aggregate([
                { $match: { body_type_ids: { $in: bodyTypeIds } } },
                { $unwind: '$body_type_ids' },
                { $match: { body_type_ids: { $in: bodyTypeIds } } },
                { $group: { _id: '$body_type_ids', count: { $sum: 1 } } },
            ]),
        ]);
        const carCountMap = new Map(carCountsRaw.map((r) => [r._id, r.count]));
        const variantCountMap = new Map(variantCountsRaw.map((r) => [r._id, r.count]));
        const seoCountMap = new Map(seoCountsRaw.map((r) => [r._id, r.count]));
        const bodyTypes = bodyTypesRaw.map((bt) => {
            const seo = computeSeoCompleteness(bt);
            return {
                ...bt,
                car_count: carCountMap.get(bt.body_type_id) || 0,
                variant_count: variantCountMap.get(bt.body_type_id) || 0,
                seo_collection_count: seoCountMap.get(bt.body_type_id) || 0,
                seo_completeness: seo.score,
                seo_missing_fields: seo.missing,
            };
        });
        const paginationMeta = pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total);
        const result = { bodyTypes, pagination: paginationMeta };
        if (isSimpleQuery) {
            cache_util_1.cache.set(cacheKey, result, 5 * 60 * 1000); // 5 minutes TTL
        }
        return result;
    }
    static async getStats() {
        const [total, published, draft, archived, missingImages] = await Promise.all([
            body_type_model_1.BodyType.countDocuments({ is_deleted: false }),
            body_type_model_1.BodyType.countDocuments({ is_deleted: false, is_published: true }),
            body_type_model_1.BodyType.countDocuments({ is_deleted: false, is_published: false }),
            body_type_model_1.BodyType.countDocuments({ is_deleted: true }),
            body_type_model_1.BodyType.countDocuments({
                is_deleted: false,
                $or: [
                    { logo: { $exists: false } },
                    { 'logo.url': { $in: [null, ''] } },
                ],
            }),
        ]);
        const missingSeo = await body_type_model_1.BodyType.countDocuments({
            is_deleted: false,
            $or: [
                { seo_title: { $in: [null, ''] } },
                { meta_description: { $in: [null, ''] } },
                { intro_content: { $in: [null, ''] } },
                { short_description: { $in: [null, ''] } },
                { 'hero_image.url': { $in: [null, ''] } },
                { hero_image: { $exists: false } },
            ],
        });
        const carBodyTypeIds = await car_model_1.Car.distinct('body_type_id', { is_deleted: false });
        const withoutCars = await body_type_model_1.BodyType.countDocuments({
            is_deleted: false,
            body_type_id: { $nin: carBodyTypeIds },
        });
        return {
            total,
            published,
            draft,
            archived,
            without_cars: withoutCars,
            missing_seo: missingSeo,
            missing_images: missingImages,
        };
    }
    static async getArchiveImpact(bodyTypeId) {
        const [cars, seoCollections] = await Promise.all([
            car_model_1.Car.countDocuments({ body_type_id: bodyTypeId, is_deleted: false }),
            seo_collection_model_1.SeoCollection.countDocuments({ body_type_ids: bodyTypeId }),
        ]);
        const variants = await car_variant_model_1.CarVariant.countDocuments({ car_id: { $in: await car_model_1.Car.distinct('car_id', { body_type_id: bodyTypeId, is_deleted: false }) } });
        // Discovery filters: if published, it appears in at least 1 discovery dimension
        const bt = await body_type_model_1.BodyType.findOne({ body_type_id: bodyTypeId, is_deleted: false }).lean();
        const discoveryFilters = bt && bt.is_published ? 1 : 0;
        return { cars, variants, seo_collections: seoCollections, discovery_filters: discoveryFilters };
    }
    static async checkDuplicate(name, excludeId) {
        const generatedSlug = slug_util_1.SlugUtil.generate(name);
        const query = { is_deleted: false };
        if (excludeId)
            query.body_type_id = { $ne: excludeId };
        const [nameDupe, slugDupe] = await Promise.all([
            body_type_model_1.BodyType.findOne({ ...query, name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } }).lean(),
            body_type_model_1.BodyType.findOne({ ...query, slug: generatedSlug }).lean(),
        ]);
        return {
            has_duplicate: !!(nameDupe || slugDupe),
            name_duplicate: !!nameDupe,
            slug_duplicate: !!slugDupe,
            generated_slug: generatedSlug,
        };
    }
    static async bulkOperation(ids, action) {
        const results = await Promise.allSettled(ids.map(async (id) => {
            switch (action) {
                case 'publish':
                    return body_type_model_1.BodyType.updateOne({ body_type_id: id, is_deleted: false }, { is_published: true, published_at: new Date() });
                case 'unpublish':
                    return body_type_model_1.BodyType.updateOne({ body_type_id: id, is_deleted: false }, { is_published: false });
                case 'archive':
                    return body_type_model_1.BodyType.updateOne({ body_type_id: id }, { is_deleted: true });
                case 'restore':
                    return body_type_model_1.BodyType.updateOne({ body_type_id: id, is_deleted: true }, { is_deleted: false });
            }
        }));
        const succeeded = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;
        return { succeeded, failed, total: ids.length };
    }
    static async reorderBodyTypes(items) {
        const ops = items.map(({ body_type_id, sort_order }) => ({
            updateOne: {
                filter: { body_type_id },
                update: { $set: { sort_order } },
            },
        }));
        await body_type_model_1.BodyType.bulkWrite(ops);
        // Invalidate cache on reorder
        cache_util_1.cache.invalidatePattern('bodytypes:');
        return { updated: items.length };
    }
    static async getBodyTypeById(bodyTypeId) {
        const bt = await body_type_model_1.BodyType.findOne({ body_type_id: bodyTypeId, is_deleted: false }).lean();
        if (!bt)
            return null;
        const seo = computeSeoCompleteness(bt);
        return { ...bt, seo_completeness: seo.score, seo_missing_fields: seo.missing };
    }
    static async getBodyTypeBySlug(slug) {
        return await body_type_model_1.BodyType.findOne({ slug, is_deleted: false });
    }
    static async createBodyType(bodyTypeData) {
        const body_type_id = (0, uuid_1.v4)();
        const slug = slug_util_1.SlugUtil.generate(bodyTypeData.name);
        const existingSlug = await body_type_model_1.BodyType.findOne({ slug, is_deleted: false });
        if (existingSlug) {
            const baseSlug = slug;
            const pattern = new RegExp(`^${baseSlug}(-\\d+)?$`);
            const matchingSlugs = (await body_type_model_1.BodyType.find({ slug: pattern, is_deleted: false }).select('slug').lean()).map((b) => b.slug);
            bodyTypeData.slug = slug_util_1.SlugUtil.generateUnique(bodyTypeData.name, matchingSlugs);
        }
        else {
            bodyTypeData.slug = slug;
        }
        const bodyType = {
            body_type_id,
            name: bodyTypeData.name,
            slug: bodyTypeData.slug,
            description: bodyTypeData.description,
            seo_title: bodyTypeData.seo_title,
            meta_description: bodyTypeData.meta_description,
            intro_content: bodyTypeData.intro_content,
            short_description: bodyTypeData.short_description,
            is_published: bodyTypeData.is_published || false,
            is_featured: bodyTypeData.is_featured || false,
            is_deleted: false,
            sort_order: bodyTypeData.sort_order || 0,
            parent_id: bodyTypeData.parent_id || null,
            related_body_types: bodyTypeData.related_body_types || [],
            created_by: bodyTypeData.created_by,
            updated_by: bodyTypeData.created_by,
        };
        if (bodyTypeData.logo_url) {
            bodyType.logo = {
                url: bodyTypeData.logo_url,
                title: bodyTypeData.logo_title || bodyTypeData.name,
            };
        }
        if (bodyTypeData.hero_image_url) {
            bodyType.hero_image = {
                url: bodyTypeData.hero_image_url,
                alt: bodyTypeData.hero_image_alt || bodyTypeData.name,
            };
        }
        if (bodyTypeData.is_published) {
            bodyType.published_at = new Date();
        }
        return await body_type_model_1.BodyType.create(bodyType);
    }
    static async updateBodyType(bodyTypeId, bodyTypeData) {
        const updateData = {};
        if (bodyTypeData.name !== undefined) {
            updateData.name = bodyTypeData.name;
            const newSlug = slug_util_1.SlugUtil.generate(bodyTypeData.name);
            const existingSlug = await body_type_model_1.BodyType.findOne({ slug: newSlug, body_type_id: { $ne: bodyTypeId }, is_deleted: false });
            if (!existingSlug) {
                updateData.slug = newSlug;
            }
        }
        if (bodyTypeData.description !== undefined)
            updateData.description = bodyTypeData.description;
        if (bodyTypeData.seo_title !== undefined)
            updateData.seo_title = bodyTypeData.seo_title;
        if (bodyTypeData.meta_description !== undefined)
            updateData.meta_description = bodyTypeData.meta_description;
        if (bodyTypeData.intro_content !== undefined)
            updateData.intro_content = bodyTypeData.intro_content;
        if (bodyTypeData.short_description !== undefined)
            updateData.short_description = bodyTypeData.short_description;
        if (bodyTypeData.sort_order !== undefined)
            updateData.sort_order = bodyTypeData.sort_order;
        if (bodyTypeData.parent_id !== undefined)
            updateData.parent_id = bodyTypeData.parent_id;
        if (bodyTypeData.related_body_types !== undefined)
            updateData.related_body_types = bodyTypeData.related_body_types;
        if (bodyTypeData.updated_by !== undefined)
            updateData.updated_by = bodyTypeData.updated_by;
        const wasPublished = !!(bodyTypeData.is_published);
        if (bodyTypeData.is_published !== undefined) {
            updateData.is_published = bodyTypeData.is_published;
            if (wasPublished) {
                updateData.published_at = new Date();
            }
        }
        if (bodyTypeData.is_featured !== undefined)
            updateData.is_featured = bodyTypeData.is_featured;
        if (bodyTypeData.logo_url !== undefined) {
            if (bodyTypeData.logo_url) {
                updateData.logo = {
                    url: bodyTypeData.logo_url,
                    title: bodyTypeData.logo_title || bodyTypeData.name,
                };
            }
            else {
                updateData.logo = undefined;
            }
        }
        if (bodyTypeData.hero_image_url !== undefined) {
            if (bodyTypeData.hero_image_url) {
                updateData.hero_image = {
                    url: bodyTypeData.hero_image_url,
                    alt: bodyTypeData.hero_image_alt || bodyTypeData.name,
                };
            }
            else {
                updateData.hero_image = undefined;
            }
        }
        const bodyType = await body_type_model_1.BodyType.findOneAndUpdate({ body_type_id: bodyTypeId, is_deleted: false }, updateData, { returnDocument: 'after' });
        if (!bodyType) {
            throw new app_error_util_1.AppError(`Body type not found or deleted for body_type_id: ${bodyTypeId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BODY_TYPE_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BODY_TYPE_NOT_FOUND,
                details: { field: 'body_type_id', reason: 'The body type does not exist or has been deleted.' },
            });
        }
        return bodyType;
    }
    static async deleteBodyType(bodyTypeId) {
        const existingBodyType = await body_type_model_1.BodyType.findOne({ body_type_id: bodyTypeId });
        if (!existingBodyType) {
            throw new app_error_util_1.AppError(`Body type not found for body_type_id: ${bodyTypeId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BODY_TYPE_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BODY_TYPE_NOT_FOUND,
                details: { field: 'body_type_id', reason: 'The body type does not exist.' },
            });
        }
        if (existingBodyType.is_deleted)
            return existingBodyType;
        const bodyType = await body_type_model_1.BodyType.findOneAndUpdate({ body_type_id: bodyTypeId, is_deleted: false }, { is_deleted: true }, { returnDocument: 'after' });
        // Invalidate cache on delete
        cache_util_1.cache.invalidatePattern('bodytypes:');
        return bodyType;
    }
    static async restoreBodyType(bodyTypeId) {
        const bodyType = await body_type_model_1.BodyType.findOneAndUpdate({ body_type_id: bodyTypeId, is_deleted: true }, { is_deleted: false }, { returnDocument: 'after' });
        if (!bodyType) {
            throw new app_error_util_1.AppError(`Body type not found for body_type_id: ${bodyTypeId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BODY_TYPE_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BODY_TYPE_NOT_FOUND,
                details: { field: 'body_type_id', reason: 'The body type does not exist in the deleted records.' },
            });
        }
        return bodyType;
    }
    static async togglePublish(bodyTypeId) {
        const bodyType = await body_type_model_1.BodyType.findOne({ body_type_id: bodyTypeId, is_deleted: false });
        if (!bodyType) {
            throw new app_error_util_1.AppError(`Body type not found or deleted for body_type_id: ${bodyTypeId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BODY_TYPE_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BODY_TYPE_NOT_FOUND,
                details: { field: 'body_type_id', reason: 'The body type does not exist or has been deleted.' },
            });
        }
        bodyType.is_published = !bodyType.is_published;
        if (bodyType.is_published && !bodyType.published_at) {
            bodyType.published_at = new Date();
        }
        await bodyType.save();
        // Invalidate cache on publish toggle
        cache_util_1.cache.invalidatePattern('bodytypes:');
        return bodyType;
    }
}
exports.BodyTypeService = BodyTypeService;
//# sourceMappingURL=bodyType.service.js.map