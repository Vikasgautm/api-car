"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionRendererService = void 0;
const popular_collection_model_1 = require("../../../models/popular-collection.model");
const discovery_service_1 = require("../../discovery/services/discovery.service");
const ranking_engine_service_1 = require("../../rankings/services/ranking-engine.service");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const SCORE_API_MAP = {
    popularity: 'popular',
    trending: 'trending',
    engagement: 'engagement',
    buyer_intent: 'buyer-intent',
    comparison_pressure: 'comparison',
    retention: 'retention',
};
class CollectionRendererService {
    // Render a full collection page
    static async renderCollection(slug, options = {}) {
        const collection = await popular_collection_model_1.PopularCollection.findOne({ slug, status: 'published' }).lean();
        if (!collection)
            throw new app_error_util_1.AppError(`Collection not found: ${slug}`, 404);
        const page = Math.max(1, options.page ?? 1);
        const limit = Math.min(options.limit ?? collection.collection_page_limit, 60);
        const sort = (options.sort ?? collection.default_sort);
        const [rankingData, discoveryResult] = await Promise.all([
            CollectionRendererService.fetchRankingData(collection),
            discovery_service_1.DiscoveryService.discover({
                ...CollectionRendererService.buildDiscoveryFilters(collection.discovery_filters, options.filter_overrides),
                page,
                limit,
                sortBy: sort,
            }),
        ]);
        const rankedCars = CollectionRendererService.applySlotSystem(discoveryResult.cars, collection, rankingData, page, limit);
        const avgConfidence = rankingData.length > 0
            ? rankingData.reduce((s, r) => s + (r.behavioral_confidence ?? 0), 0) / rankingData.length
            : 0;
        const pag = discoveryResult.pagination;
        await popular_collection_model_1.PopularCollection.updateOne({ collection_id: collection.collection_id }, { last_rendered_at: new Date() });
        return {
            collection: {
                collection_id: collection.collection_id,
                slug: collection.slug,
                title: collection.title,
                subtitle: collection.subtitle,
                description: collection.description,
                collection_type: collection.collection_type,
                rendering_mode: collection.rendering_mode,
                primary_score_type: collection.primary_score_type,
                view_all_path: collection.view_all_path,
                related_collection_slugs: collection.related_collection_slugs,
                seo: {
                    h1: collection.seo_h1,
                    meta_title: collection.seo_meta_title,
                    meta_description: collection.seo_meta_description,
                    intro_content: collection.seo_intro_content,
                    conclusion_content: collection.seo_conclusion_content,
                    noindex: collection.seo_noindex,
                    canonical_url: collection.seo_canonical_url,
                },
            },
            cars: rankedCars,
            pagination: {
                total: pag?.total ?? discoveryResult.cars.length,
                page,
                limit,
                total_pages: pag?.totalPages ?? pag?.total_pages ?? 1,
            },
            facets: discoveryResult.facets,
            engine_status: {
                rendering_mode: collection.rendering_mode,
                behavioral_confidence: Math.round(avgConfidence * 100),
                is_behavioral_active: collection.rendering_mode === 'behavioral' &&
                    avgConfidence >= collection.min_behavioral_confidence / 100,
            },
        };
    }
    // Render hub preview: top N cars from each published hub-visible collection
    static async renderHubPreview() {
        const collections = await popular_collection_model_1.PopularCollection.find({
            status: 'published',
            display_on_hub: true,
        })
            .sort({ hub_section_order: 1 })
            .lean();
        const sections = await Promise.allSettled(collections.map(async (coll) => {
            const [rankingData, discoveryResult] = await Promise.all([
                CollectionRendererService.fetchRankingData(coll),
                discovery_service_1.DiscoveryService.discover({
                    ...CollectionRendererService.buildDiscoveryFilters(coll.discovery_filters),
                    page: 1,
                    limit: coll.hub_preview_limit + 20,
                    sortBy: coll.default_sort,
                }),
            ]);
            const rankedCars = CollectionRendererService.applySlotSystem(discoveryResult.cars, coll, rankingData, 1, coll.hub_preview_limit);
            return {
                collection: {
                    collection_id: coll.collection_id,
                    slug: coll.slug,
                    title: coll.title,
                    subtitle: coll.subtitle,
                    hub_section_label: coll.hub_section_label ?? coll.title,
                    view_all_path: coll.view_all_path,
                    collection_type: coll.collection_type,
                },
                cars: rankedCars.slice(0, coll.hub_preview_limit),
                hub_section_order: coll.hub_section_order,
            };
        }));
        return sections
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value);
    }
    // Fetch ranking data for a collection (always runs — even in observe_only)
    static async fetchRankingData(collection) {
        try {
            const scoreType = collection.primary_score_type === 'manual' ? 'popularity' : collection.primary_score_type;
            const apiPath = SCORE_API_MAP[scoreType] ?? 'popular';
            const params = { entity_type: 'car', limit: 300 };
            switch (apiPath) {
                case 'popular':
                    return await ranking_engine_service_1.RankingEngineService.getPopular(params);
                case 'trending':
                    return await ranking_engine_service_1.RankingEngineService.getTrending(params);
                case 'engagement':
                    return await ranking_engine_service_1.RankingEngineService.getByEngagement(params);
                case 'buyer-intent':
                    return await ranking_engine_service_1.RankingEngineService.getByBuyerIntent(params);
                case 'comparison':
                    return await ranking_engine_service_1.RankingEngineService.getByComparison(params);
                case 'retention':
                    return await ranking_engine_service_1.RankingEngineService.getByRetention(params);
                default:
                    return await ranking_engine_service_1.RankingEngineService.getPopular(params);
            }
        }
        catch {
            return [];
        }
    }
    // Map collection discovery_filters to DiscoveryService DiscoveryFilters
    static buildDiscoveryFilters(collFilters, overrides) {
        const filters = {};
        if (collFilters.body_type_slugs?.length)
            filters.body_type_slugs = collFilters.body_type_slugs;
        if (collFilters.fuel_type_slugs?.length)
            filters.fuel_type_slugs = collFilters.fuel_type_slugs;
        if (collFilters.brand_slugs?.length)
            filters.brand_slugs = collFilters.brand_slugs;
        if (collFilters.lifecycle_stages?.length)
            filters.status = collFilters.lifecycle_stages;
        if (collFilters.min_price !== undefined)
            filters.min_price = collFilters.min_price;
        if (collFilters.max_price !== undefined)
            filters.max_price = collFilters.max_price;
        if (collFilters.transmission?.length)
            filters.transmission = collFilters.transmission;
        if (collFilters.seating_min !== undefined)
            filters.seating_min = collFilters.seating_min;
        if (collFilters.seating_max !== undefined)
            filters.seating_max = collFilters.seating_max;
        if (collFilters.has_adas !== undefined)
            filters.has_adas = collFilters.has_adas;
        if (collFilters.has_sunroof !== undefined)
            filters.has_sunroof = collFilters.has_sunroof;
        if (collFilters.mileage_class?.length)
            filters.mileage_class = collFilters.mileage_class;
        if (collFilters.is_electric !== undefined)
            filters.is_electric = collFilters.is_electric;
        if (collFilters.vehicle_segment?.length)
            filters.vehicle_segment = collFilters.vehicle_segment;
        if (collFilters.tags?.length)
            filters.tags = collFilters.tags;
        if (collFilters.family_friendly !== undefined)
            filters.family_friendly = collFilters.family_friendly;
        if (overrides)
            Object.assign(filters, overrides);
        return filters;
    }
    // Apply editorial slot system to order cars
    static applySlotSystem(discoveryCars, collection, rankingData, page, limit) {
        const rankingMap = new Map();
        for (const r of rankingData) {
            rankingMap.set(String(r.entity_id), r);
        }
        const suppressed = new Set((collection.suppressed_car_ids || []).map(String));
        const eligible = discoveryCars.filter((car) => {
            const id = String(car.car_id ?? car._id ?? '');
            return !suppressed.has(id);
        });
        const annotate = (car, slotType, rank) => {
            const id = String(car.car_id ?? car._id ?? '');
            const r = rankingMap.get(id);
            return {
                car,
                rank,
                slot_type: slotType,
                ranking_score: r?.score,
                behavioral_confidence: r?.behavioral_confidence,
                trending_direction: r?.trending_direction,
                trending_velocity: r?.trending_velocity,
            };
        };
        const mode = collection.rendering_mode;
        if (mode === 'manual' || mode === 'observe_only') {
            if (page === 1) {
                return CollectionRendererService.applyManualSlots(eligible, collection, annotate, limit);
            }
            return eligible.slice(0, limit).map((car, i) => annotate(car, 'discovery', (page - 1) * limit + i + 1));
        }
        if (mode === 'hybrid') {
            return CollectionRendererService.applyHybridSlots(eligible, collection, rankingMap, annotate, page, limit);
        }
        if (mode === 'behavioral') {
            const avgConf = rankingData.length > 0
                ? rankingData.reduce((s, r) => s + (r.behavioral_confidence ?? 0), 0) / rankingData.length
                : 0;
            const threshold = collection.min_behavioral_confidence / 100;
            if (avgConf < threshold) {
                // Not enough confidence — fall back to manual
                return CollectionRendererService.applyManualSlots(eligible, collection, annotate, limit);
            }
            return CollectionRendererService.applyBehavioralSlots(eligible, collection, rankingMap, annotate, page, limit);
        }
        return eligible.slice(0, limit).map((car, i) => annotate(car, 'discovery', i + 1));
    }
    static applyManualSlots(eligible, collection, annotate, limit) {
        const carMap = new Map();
        for (const car of eligible) {
            carMap.set(String(car.car_id ?? car._id ?? ''), car);
        }
        const result = [];
        let rank = 1;
        const seen = new Set();
        for (const id of (collection.pinned_car_ids || [])) {
            const car = carMap.get(id);
            if (car) {
                result.push(annotate(car, 'pinned', rank++));
                seen.add(id);
            }
        }
        for (const id of (collection.manual_car_ids || [])) {
            if (!seen.has(id)) {
                const car = carMap.get(id);
                if (car) {
                    result.push(annotate(car, 'manual', rank++));
                    seen.add(id);
                }
            }
        }
        for (const car of eligible) {
            const id = String(car.car_id ?? car._id ?? '');
            if (!seen.has(id)) {
                result.push(annotate(car, 'discovery', rank++));
            }
        }
        return result.slice(0, limit);
    }
    static applyHybridSlots(eligible, collection, rankingMap, annotate, page, limit) {
        const mW = collection.manual_weight / 100;
        const bW = collection.behavioral_weight / 100;
        const pinnedSet = new Set(collection.pinned_car_ids || []);
        const scored = eligible.map((car) => {
            const id = String(car.car_id ?? car._id ?? '');
            const r = rankingMap.get(id);
            const manualCarIds = collection.manual_car_ids || [];
            const manualIdx = manualCarIds.indexOf(id);
            const manualScore = manualIdx >= 0 ? 1 - manualIdx / Math.max(manualCarIds.length, 1) : 0;
            const behScore = r?.score ?? 0;
            const isPinned = pinnedSet.has(id);
            return {
                car,
                id,
                blended: isPinned ? Infinity : manualScore * mW + behScore * bW,
                isPinned,
                r,
            };
        });
        scored.sort((a, b) => b.blended - a.blended);
        const offset = (page - 1) * limit;
        return scored.slice(offset, offset + limit).map((item, i) => ({
            car: item.car,
            rank: offset + i + 1,
            slot_type: item.isPinned ? 'pinned' : 'hybrid',
            ranking_score: item.r?.score,
            behavioral_confidence: item.r?.behavioral_confidence,
            trending_direction: item.r?.trending_direction,
            trending_velocity: item.r?.trending_velocity,
        }));
    }
    static applyBehavioralSlots(eligible, collection, rankingMap, annotate, page, limit) {
        const pinnedSet = new Set(collection.pinned_car_ids || []);
        const scored = eligible.map((car) => {
            const id = String(car.car_id ?? car._id ?? '');
            const r = rankingMap.get(id);
            return {
                car,
                score: pinnedSet.has(id) ? Infinity : (r?.score ?? 0),
                isPinned: pinnedSet.has(id),
                r,
            };
        });
        scored.sort((a, b) => b.score - a.score);
        const offset = (page - 1) * limit;
        return scored.slice(offset, offset + limit).map((item, i) => ({
            car: item.car,
            rank: offset + i + 1,
            slot_type: item.isPinned ? 'pinned' : 'behavioral',
            ranking_score: item.r?.score,
            behavioral_confidence: item.r?.behavioral_confidence,
            trending_direction: item.r?.trending_direction,
            trending_velocity: item.r?.trending_velocity,
        }));
    }
}
exports.CollectionRendererService = CollectionRendererService;
