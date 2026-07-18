import {
  PopularCollection,
  IPopularCollection,
  IDiscoveryFilters,
} from '../../../models/popular-collection.model';
import {
  DiscoveryService,
  DiscoveryFilters,
  SortKey,
} from '../../discovery/services/discovery.service';
import { RankingEngineService } from '../../rankings/services/ranking-engine.service';
import { AppError } from '../../../shared/utils/app-error.util';

export interface CollectionRenderOptions {
  page?: number;
  limit?: number;
  sort?: string;
  filter_overrides?: Partial<DiscoveryFilters>;
}

export interface RenderedCollectionCar {
  car: any;
  rank: number;
  slot_type: 'pinned' | 'manual' | 'hybrid' | 'behavioral' | 'discovery';
  ranking_score?: number;
  behavioral_confidence?: number;
  trending_direction?: string;
  trending_velocity?: number;
}

export interface RenderedCollection {
  collection: {
    collection_id: string;
    slug: string;
    title: string;
    subtitle?: string;
    description?: string;
    collection_type: string;
    rendering_mode: string;
    primary_score_type: string;
    view_all_path: string;
    related_collection_slugs: string[];
    seo: {
      h1?: string;
      meta_title?: string;
      meta_description?: string;
      intro_content?: string;
      conclusion_content?: string;
      noindex: boolean;
      canonical_url?: string;
    };
  };
  cars: RenderedCollectionCar[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  facets?: any;
  engine_status: {
    rendering_mode: string;
    behavioral_confidence: number;
    is_behavioral_active: boolean;
  };
}

export interface HubSection {
  collection: {
    collection_id: string;
    slug: string;
    title: string;
    subtitle?: string;
    hub_section_label?: string;
    view_all_path: string;
    collection_type: string;
  };
  cars: RenderedCollectionCar[];
  hub_section_order: number;
}

const SCORE_API_MAP: Record<string, string> = {
  popularity: 'popular',
  trending: 'trending',
  engagement: 'engagement',
  buyer_intent: 'buyer-intent',
  comparison_pressure: 'comparison',
  retention: 'retention',
};

export class CollectionRendererService {
  // Render a full collection page
  static async renderCollection(
    slug: string,
    options: CollectionRenderOptions = {}
  ): Promise<RenderedCollection> {
    const collection = await PopularCollection.findOne({ slug, status: 'published' }).lean();
    if (!collection) throw new AppError(`Collection not found: ${slug}`, 404);

    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(options.limit ?? collection.collection_page_limit, 60);
    const sort = (options.sort ?? collection.default_sort) as SortKey;

    const [rankingData, discoveryResult] = await Promise.all([
      CollectionRendererService.fetchRankingData(collection),
      DiscoveryService.discover({
        ...CollectionRendererService.buildDiscoveryFilters(
          collection.discovery_filters,
          options.filter_overrides
        ),
        page,
        limit,
        sortBy: sort,
      }),
    ]);

    const rankedCars = CollectionRendererService.applySlotSystem(
      discoveryResult.cars,
      collection,
      rankingData,
      page,
      limit
    );

    const avgConfidence =
      rankingData.length > 0
        ? rankingData.reduce((s, r) => s + (r.behavioral_confidence ?? 0), 0) / rankingData.length
        : 0;

    const pag = discoveryResult.pagination as any;

    await PopularCollection.updateOne(
      { collection_id: collection.collection_id },
      { last_rendered_at: new Date() }
    );

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
        is_behavioral_active:
          collection.rendering_mode === 'behavioral' &&
          avgConfidence >= collection.min_behavioral_confidence / 100,
      },
    };
  }

  // Render hub preview: top N cars from each published hub-visible collection
  static async renderHubPreview(): Promise<HubSection[]> {
    const collections = await PopularCollection.find({
      status: 'published',
      display_on_hub: true,
    })
      .sort({ hub_section_order: 1 })
      .lean();

    const sections = await Promise.allSettled(
      collections.map(async (coll) => {
        const [rankingData, discoveryResult] = await Promise.all([
          CollectionRendererService.fetchRankingData(coll),
          DiscoveryService.discover({
            ...CollectionRendererService.buildDiscoveryFilters(coll.discovery_filters),
            page: 1,
            limit: coll.hub_preview_limit + 20,
            sortBy: coll.default_sort as SortKey,
          }),
        ]);

        const rankedCars = CollectionRendererService.applySlotSystem(
          discoveryResult.cars,
          coll,
          rankingData,
          1,
          coll.hub_preview_limit
        );

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
        } as HubSection;
      })
    );

    return sections
      .filter((r): r is PromiseFulfilledResult<HubSection> => r.status === 'fulfilled')
      .map((r) => r.value);
  }

  // Fetch ranking data for a collection (always runs — even in observe_only)
  static async fetchRankingData(collection: IPopularCollection): Promise<any[]> {
    try {
      const scoreType =
        collection.primary_score_type === 'manual' ? 'popularity' : collection.primary_score_type;
      const apiPath = SCORE_API_MAP[scoreType] ?? 'popular';
      const params = { entity_type: 'car', limit: 300 };

      switch (apiPath) {
        case 'popular':
          return await RankingEngineService.getPopular(params);
        case 'trending':
          return await RankingEngineService.getTrending(params);
        case 'engagement':
          return await RankingEngineService.getByEngagement(params);
        case 'buyer-intent':
          return await RankingEngineService.getByBuyerIntent(params);
        case 'comparison':
          return await RankingEngineService.getByComparison(params);
        case 'retention':
          return await RankingEngineService.getByRetention(params);
        default:
          return await RankingEngineService.getPopular(params);
      }
    } catch {
      return [];
    }
  }

  // Map collection discovery_filters to DiscoveryService DiscoveryFilters
  static buildDiscoveryFilters(
    collFilters: IDiscoveryFilters,
    overrides?: Partial<DiscoveryFilters>
  ): DiscoveryFilters {
    const filters: DiscoveryFilters = {};

    if (collFilters.body_type_slugs?.length) filters.body_type_slugs = collFilters.body_type_slugs;
    if (collFilters.fuel_type_slugs?.length) filters.fuel_type_slugs = collFilters.fuel_type_slugs;
    if (collFilters.brand_slugs?.length) filters.brand_slugs = collFilters.brand_slugs;
    if (collFilters.lifecycle_stages?.length) filters.status = collFilters.lifecycle_stages;
    if (collFilters.min_price !== undefined) filters.min_price = collFilters.min_price;
    if (collFilters.max_price !== undefined) filters.max_price = collFilters.max_price;
    if (collFilters.transmission?.length) filters.transmission = collFilters.transmission;
    if (collFilters.seating_min !== undefined) filters.seating_min = collFilters.seating_min;
    if (collFilters.seating_max !== undefined) filters.seating_max = collFilters.seating_max;
    if (collFilters.has_adas !== undefined) filters.has_adas = collFilters.has_adas;
    if (collFilters.has_sunroof !== undefined) filters.has_sunroof = collFilters.has_sunroof;
    if (collFilters.mileage_class?.length) filters.mileage_class = collFilters.mileage_class;
    if (collFilters.is_electric !== undefined) filters.is_electric = collFilters.is_electric;
    if (collFilters.vehicle_segment?.length) filters.vehicle_segment = collFilters.vehicle_segment;
    if (collFilters.tags?.length) filters.tags = collFilters.tags;
    if (collFilters.family_friendly !== undefined) filters.family_friendly = collFilters.family_friendly;

    if (overrides) Object.assign(filters, overrides);
    return filters;
  }

  // Apply editorial slot system to order cars
  private static applySlotSystem(
    discoveryCars: any[],
    collection: IPopularCollection,
    rankingData: any[],
    page: number,
    limit: number
  ): RenderedCollectionCar[] {
    const rankingMap = new Map<string, any>();
    for (const r of rankingData) {
      rankingMap.set(String(r.entity_id), r);
    }

    const suppressed = new Set((collection.suppressed_car_ids || []).map(String));
    const eligible = discoveryCars.filter((car) => {
      const id = String(car.car_id ?? car._id ?? '');
      return !suppressed.has(id);
    });

    const annotate = (car: any, slotType: string, rank: number): RenderedCollectionCar => {
      const id = String(car.car_id ?? car._id ?? '');
      const r = rankingMap.get(id);
      return {
        car,
        rank,
        slot_type: slotType as any,
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
      return eligible.slice(0, limit).map((car, i) =>
        annotate(car, 'discovery', (page - 1) * limit + i + 1)
      );
    }

    if (mode === 'hybrid') {
      return CollectionRendererService.applyHybridSlots(eligible, collection, rankingMap, annotate, page, limit);
    }

    if (mode === 'behavioral') {
      const avgConf =
        rankingData.length > 0
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

  private static applyManualSlots(
    eligible: any[],
    collection: IPopularCollection,
    annotate: (car: any, slot: string, rank: number) => RenderedCollectionCar,
    limit: number
  ): RenderedCollectionCar[] {
    const carMap = new Map<string, any>();
    for (const car of eligible) {
      carMap.set(String(car.car_id ?? car._id ?? ''), car);
    }

    const result: RenderedCollectionCar[] = [];
    let rank = 1;
    const seen = new Set<string>();

    for (const id of (collection.pinned_car_ids || [])) {
      const car = carMap.get(id);
      if (car) { result.push(annotate(car, 'pinned', rank++)); seen.add(id); }
    }

    for (const id of (collection.manual_car_ids || [])) {
      if (!seen.has(id)) {
        const car = carMap.get(id);
        if (car) { result.push(annotate(car, 'manual', rank++)); seen.add(id); }
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

  private static applyHybridSlots(
    eligible: any[],
    collection: IPopularCollection,
    rankingMap: Map<string, any>,
    annotate: (car: any, slot: string, rank: number) => RenderedCollectionCar,
    page: number,
    limit: number
  ): RenderedCollectionCar[] {
    const mW = collection.manual_weight / 100;
    const bW = collection.behavioral_weight / 100;
    const pinnedSet = new Set(collection.pinned_car_ids || []);

    const scored = eligible.map((car) => {
      const id = String(car.car_id ?? car._id ?? '');
      const r = rankingMap.get(id);
      const manualCarIds = collection.manual_car_ids || [];
      const manualIdx = manualCarIds.indexOf(id);
      const manualScore =
        manualIdx >= 0 ? 1 - manualIdx / Math.max(manualCarIds.length, 1) : 0;
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

  private static applyBehavioralSlots(
    eligible: any[],
    collection: IPopularCollection,
    rankingMap: Map<string, any>,
    annotate: (car: any, slot: string, rank: number) => RenderedCollectionCar,
    page: number,
    limit: number
  ): RenderedCollectionCar[] {
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
