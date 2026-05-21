"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoCollectionService = void 0;
const uuid_1 = require("uuid");
const body_type_model_1 = require("../../../models/body-type.model");
const fuel_type_model_1 = require("../../../models/fuel-type.model");
const seo_collection_model_1 = require("../../../models/seo-collection.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const discovery_service_1 = require("../../discovery/services/discovery.service");
const related_collections_service_1 = require("./related-collections.service");
const seo_combination_validator_service_1 = require("./seo-combination-validator.service");
const seo_collection_content_service_1 = require("./seo-collection-content.service");
const seo_collection_health_service_1 = require("./seo-collection-health.service");
const seo_collection_query_service_1 = require("./seo-collection-query.service");
const seo_faq_service_1 = require("./seo-faq.service");
const seo_slug_service_1 = require("./seo-slug.service");
class SeoCollectionService {
    static async list(params) {
        const filter = {};
        if (params.include_deleted !== 'true' && params.include_deleted !== true) {
            filter.is_deleted = false;
        }
        if (params.q)
            filter.title = { $regex: params.q, $options: 'i' };
        if (params.collection_type)
            filter.collection_type = params.collection_type;
        if (params.status)
            filter.status = params.status;
        if (params.seo_index_status)
            filter.seo_index_status = params.seo_index_status;
        const pageNum = Number(params.page ?? 1);
        const limitNum = Number(params.limit ?? 25);
        const { skip, limit } = pagination_util_1.PaginationUtil.getPaginationParams(pageNum, limitNum);
        const [rows, total] = await Promise.all([
            seo_collection_model_1.SeoCollection.find(filter)
                .sort({ priority_score: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            seo_collection_model_1.SeoCollection.countDocuments(filter),
        ]);
        return { collections: rows, pagination: pagination_util_1.PaginationUtil.createPaginationMeta(pageNum, limit, total) };
    }
    static async getById(collection_id) {
        const collection = await seo_collection_model_1.SeoCollection.findOne({ collection_id, is_deleted: false }).lean();
        if (!collection)
            throw new app_error_util_1.AppError(`SEO collection not found: ${collection_id}`, 404);
        return collection;
    }
    static async getBySlug(slug) {
        return seo_collection_model_1.SeoCollection.findOne({ slug, is_deleted: false, status: 'published' }).lean();
    }
    static async create(data, userId) {
        // Resolve fuel + body slugs for combination validation
        const fuelSlugs = data.fuel_type_ids?.length
            ? (await fuel_type_model_1.FuelType.find({ fuel_type_id: { $in: data.fuel_type_ids } }).select('slug').lean()).map((f) => f.slug)
            : [];
        const bodySlugs = data.body_type_ids?.length
            ? (await body_type_model_1.BodyType.find({ body_type_id: { $in: data.body_type_ids } }).select('slug').lean()).map((b) => b.slug)
            : [];
        const validation = seo_combination_validator_service_1.SeoCombinationValidatorService.validate({ fuel_type_slugs: fuelSlugs, body_type_slugs: bodySlugs });
        if (!validation.valid)
            throw new app_error_util_1.AppError(validation.reason, 422);
        // Slug
        const slug = data.slug
            ? await seo_slug_service_1.SeoSlugService.ensureUnique(data.slug)
            : await seo_slug_service_1.SeoSlugService.generate({
                collection_type: data.collection_type,
                fuel_type_ids: data.fuel_type_ids,
                body_type_ids: data.body_type_ids,
                brand_ids: data.brand_ids,
                transmission_types: data.transmission_types,
                budget_max: data.budget_max,
                mileage_classes: data.mileage_classes,
            });
        // Discovery query + car count
        const generatedQuery = await seo_collection_query_service_1.SeoCollectionQueryService.buildDiscoveryFilters(data);
        const discoveryResult = await discovery_service_1.DiscoveryService.discover({ ...generatedQuery, limit: 1 });
        const matched_car_count = discoveryResult.pagination?.total ?? 0;
        // SEO content
        let seo = { ...(data.seo ?? {}) };
        if (data.auto_generate_content) {
            const generated = await seo_collection_content_service_1.SeoCollectionContentService.generateAll(data);
            seo = { ...generated, ...seo };
        }
        // FAQs
        let faq_items = data.faq_items ?? [];
        if (!faq_items.length && data.auto_generate_faqs) {
            faq_items = await seo_faq_service_1.SeoFaqService.generateFaqs(data.collection_type, {
                fuel_type_ids: data.fuel_type_ids,
                body_type_ids: data.body_type_ids,
                budget_max: data.budget_max,
                transmission_types: data.transmission_types,
                mileage_classes: data.mileage_classes,
            });
        }
        // Health
        const health = await seo_collection_health_service_1.SeoCollectionHealthService.computeHealth({
            matched_car_count,
            seo,
            faq_items,
            slug,
            fuel_type_ids: data.fuel_type_ids ?? [],
            body_type_ids: data.body_type_ids ?? [],
            budget_min: data.budget_min,
            budget_max: data.budget_max,
        });
        const collection = await seo_collection_model_1.SeoCollection.create({
            collection_id: (0, uuid_1.v4)(),
            title: data.title,
            slug,
            collection_type: data.collection_type,
            primary_keyword: data.primary_keyword ?? null,
            fuel_type_ids: data.fuel_type_ids ?? [],
            body_type_ids: data.body_type_ids ?? [],
            brand_ids: data.brand_ids ?? [],
            transmission_types: data.transmission_types ?? [],
            seating_capacities: data.seating_capacities ?? [],
            feature_flags: data.feature_flags ?? [],
            mileage_classes: data.mileage_classes ?? [],
            budget_min: data.budget_min ?? null,
            budget_max: data.budget_max ?? null,
            usage_intents: data.usage_intents ?? [],
            ownership_intents: data.ownership_intents ?? [],
            safety_intents: data.safety_intents ?? [],
            family_intents: data.family_intents ?? [],
            generated_query: generatedQuery,
            matched_car_count,
            related_collection_ids: [],
            seo,
            faq_items,
            seo_index_status: health.seo_index_status,
            auto_noindex: health.auto_noindex,
            health_score: health.health_score,
            duplicate_risk_score: health.duplicate_risk_score,
            overlap_percentage: 0,
            featured_rank: data.featured_rank ?? null,
            priority_score: data.priority_score ?? 0,
            auto_generated: data.auto_generated ?? false,
            last_refreshed_at: new Date(),
            status: data.status ?? 'draft',
            is_deleted: false,
            created_by: userId ?? null,
            updated_by: userId ?? null,
        });
        // Fire-and-forget related backfill
        this._refreshRelated(collection.collection_id).catch(() => null);
        return collection;
    }
    static async update(collection_id, data, userId) {
        const existing = await seo_collection_model_1.SeoCollection.findOne({ collection_id, is_deleted: false });
        if (!existing)
            throw new app_error_util_1.AppError(`SEO collection not found: ${collection_id}`, 404);
        const update = {};
        if (data.title !== undefined)
            update.title = data.title;
        if (data.slug !== undefined) {
            update.slug = await seo_slug_service_1.SeoSlugService.ensureUnique(data.slug, collection_id);
        }
        const dimensionFields = [
            'collection_type', 'primary_keyword',
            'fuel_type_ids', 'body_type_ids', 'brand_ids',
            'transmission_types', 'seating_capacities', 'feature_flags', 'mileage_classes',
            'budget_min', 'budget_max',
            'usage_intents', 'ownership_intents', 'safety_intents', 'family_intents',
        ];
        for (const field of dimensionFields) {
            if (data[field] !== undefined)
                update[field] = data[field];
        }
        if (data.seo !== undefined)
            update.seo = { ...existing.seo, ...data.seo };
        if (data.faq_items !== undefined)
            update.faq_items = data.faq_items;
        if (data.status !== undefined)
            update.status = data.status;
        if (data.seo_index_status !== undefined)
            update.seo_index_status = data.seo_index_status;
        if (data.featured_rank !== undefined)
            update.featured_rank = data.featured_rank;
        if (data.priority_score !== undefined)
            update.priority_score = data.priority_score;
        update.updated_by = userId ?? null;
        // Rebuild query if any dimension changed
        const dimensionChanged = dimensionFields.some(f => data[f] !== undefined);
        if (dimensionChanged) {
            const merged = { ...existing.toObject(), ...update };
            update.generated_query = await seo_collection_query_service_1.SeoCollectionQueryService.buildDiscoveryFilters(merged);
            const result = await discovery_service_1.DiscoveryService.discover({ ...update.generated_query, limit: 1 });
            update.matched_car_count = result.pagination?.total ?? 0;
            update.last_refreshed_at = new Date();
        }
        await seo_collection_model_1.SeoCollection.findOneAndUpdate({ collection_id, is_deleted: false }, update, { new: true });
        // Refresh health
        await seo_collection_health_service_1.SeoCollectionHealthService.refreshCollection(collection_id);
        return seo_collection_model_1.SeoCollection.findOne({ collection_id }).lean();
    }
    static async softDelete(collection_id) {
        const updated = await seo_collection_model_1.SeoCollection.findOneAndUpdate({ collection_id, is_deleted: false }, { is_deleted: true, deleted_at: new Date() }, { returnDocument: 'after' });
        if (!updated)
            throw new app_error_util_1.AppError(`SEO collection not found: ${collection_id}`, 404);
        return updated;
    }
    static async refresh(collection_id) {
        const collection = await seo_collection_model_1.SeoCollection.findOne({ collection_id, is_deleted: false });
        if (!collection)
            throw new app_error_util_1.AppError(`SEO collection not found: ${collection_id}`, 404);
        const filters = await seo_collection_query_service_1.SeoCollectionQueryService.buildDiscoveryFilters(collection);
        const result = await discovery_service_1.DiscoveryService.discover({ ...filters, limit: 1 });
        const matched_car_count = result.pagination?.total ?? 0;
        await seo_collection_model_1.SeoCollection.updateOne({ collection_id }, { matched_car_count, generated_query: filters, last_refreshed_at: new Date() });
        await seo_collection_health_service_1.SeoCollectionHealthService.refreshCollection(collection_id);
        await this._refreshRelated(collection_id);
        return seo_collection_model_1.SeoCollection.findOne({ collection_id }).lean();
    }
    static async hydrate(slug, page) {
        const collection = await this.getBySlug(slug);
        if (!collection)
            throw app_error_util_1.AppError.notFound('SEO collection', 'slug', slug);
        const filters = await seo_collection_query_service_1.SeoCollectionQueryService.buildDiscoveryFilters(collection);
        if (page)
            filters.page = page;
        const discoveryResult = await discovery_service_1.DiscoveryService.discover(filters);
        return { collection, ...discoveryResult };
    }
    static async generateContent(collection_id) {
        const collection = await this.getById(collection_id);
        const [content, faqs] = await Promise.all([
            seo_collection_content_service_1.SeoCollectionContentService.generateAll(collection),
            seo_faq_service_1.SeoFaqService.generateFaqs(collection.collection_type, {
                fuel_type_ids: collection.fuel_type_ids,
                body_type_ids: collection.body_type_ids,
                budget_max: collection.budget_max,
                transmission_types: collection.transmission_types,
                mileage_classes: collection.mileage_classes,
            }),
        ]);
        await seo_collection_model_1.SeoCollection.updateOne({ collection_id }, { seo: { ...collection.seo, ...content }, faq_items: faqs });
        return seo_collection_model_1.SeoCollection.findOne({ collection_id }).lean();
    }
    static async getHealth(params) {
        const filter = { is_deleted: false };
        switch (params.issue_type) {
            case 'low_count':
                filter.matched_car_count = { $lt: 3 };
                break;
            case 'noindex':
                filter.seo_index_status = 'noindex';
                break;
            case 'low_health':
                filter.health_score = { $lt: 50 };
                break;
            case 'duplicate':
                filter.duplicate_risk_score = { $gte: 50 };
                break;
            case 'stale': {
                const stale = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                filter.last_refreshed_at = { $lt: stale };
                break;
            }
        }
        const pageNum = Number(params.page ?? 1);
        const limitNum = Number(params.limit ?? 25);
        const { skip, limit } = pagination_util_1.PaginationUtil.getPaginationParams(pageNum, limitNum);
        const [rows, total] = await Promise.all([
            seo_collection_model_1.SeoCollection.find(filter).sort({ health_score: 1 }).skip(skip).limit(limit).lean(),
            seo_collection_model_1.SeoCollection.countDocuments(filter),
        ]);
        return { collections: rows, pagination: pagination_util_1.PaginationUtil.createPaginationMeta(pageNum, limit, total) };
    }
    static async getHealthSummary() {
        const stale = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [total, noindex, low_count, low_health, duplicate, stale_count] = await Promise.all([
            seo_collection_model_1.SeoCollection.countDocuments({ is_deleted: false }),
            seo_collection_model_1.SeoCollection.countDocuments({ is_deleted: false, seo_index_status: 'noindex' }),
            seo_collection_model_1.SeoCollection.countDocuments({ is_deleted: false, matched_car_count: { $lt: 3 } }),
            seo_collection_model_1.SeoCollection.countDocuments({ is_deleted: false, health_score: { $lt: 50 } }),
            seo_collection_model_1.SeoCollection.countDocuments({ is_deleted: false, duplicate_risk_score: { $gte: 50 } }),
            seo_collection_model_1.SeoCollection.countDocuments({ is_deleted: false, last_refreshed_at: { $lt: stale } }),
        ]);
        return { total, noindex, low_count, low_health, duplicate, stale: stale_count };
    }
    static async previewQuery(data) {
        const filters = await seo_collection_query_service_1.SeoCollectionQueryService.buildDiscoveryFilters(data);
        const result = await discovery_service_1.DiscoveryService.discover({ ...filters, limit: 6 });
        return result;
    }
    static async _refreshRelated(collection_id) {
        const collection = await seo_collection_model_1.SeoCollection.findOne({ collection_id, is_deleted: false });
        if (!collection)
            return;
        const related = await related_collections_service_1.RelatedCollectionsService.findRelated(collection);
        await seo_collection_model_1.SeoCollection.updateOne({ collection_id }, { related_collection_ids: related });
    }
}
exports.SeoCollectionService = SeoCollectionService;
//# sourceMappingURL=seo-collection.service.js.map