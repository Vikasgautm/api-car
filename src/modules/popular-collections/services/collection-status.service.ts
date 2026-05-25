import { PopularCollection } from '../../../models/popular-collection.model';
import { RankingEngineService } from '../../rankings/services/ranking-engine.service';
import { CollectionRendererService } from './collection-renderer.service';

export interface CollectionStatusEntry {
  collection_id: string;
  slug: string;
  title: string;
  collection_type: string;
  rendering_mode: string;
  status: string;
  behavioral_confidence: number;
  recommendation: string;
  recommendation_detail: string;
  car_count: number;
  pinned_count: number;
  manual_count: number;
  suppressed_count: number;
  last_rendered_at?: Date;
  rising_cars: string[];
  is_behavioral_ready: boolean;
}

export interface SystemEngineStatus {
  total_collections: number;
  published_collections: number;
  manual_mode_count: number;
  hybrid_mode_count: number;
  behavioral_mode_count: number;
  observe_only_count: number;
  avg_behavioral_confidence: number;
  collections_ready_for_hybrid: number;
  collections_ready_for_behavioral: number;
  engine_status: any;
  collection_statuses: CollectionStatusEntry[];
}

export class CollectionStatusService {
  static async getSystemStatus(): Promise<SystemEngineStatus> {
    const [collections, engineStatus] = await Promise.all([
      PopularCollection.find().sort({ hub_section_order: 1 }).lean(),
      CollectionStatusService.safeGetEngineStatus(),
    ]);

    const [popularRankings] = await Promise.all([
      CollectionStatusService.safeGetRankings(),
    ]);

    const risingSet = new Set<string>(
      popularRankings
        .filter((r: any) => r.trending_direction === 'rising')
        .map((r: any) => String(r.entity_id))
    );

    const statuses = collections.map((coll): CollectionStatusEntry => {
      const rankingData = popularRankings.filter(() => true); // all cars
      const avgConf =
        rankingData.length > 0
          ? rankingData.reduce((s: number, r: any) => s + (r.behavioral_confidence ?? 0), 0) /
            rankingData.length
          : 0;

      const confPct = Math.round(avgConf * 100);
      const threshold = coll.min_behavioral_confidence;
      const isReady = confPct >= threshold;

      let recommendation: string;
      let detail: string;

      if (coll.rendering_mode === 'behavioral' && isReady) {
        recommendation = 'Behavioral Active';
        detail = `Engine is running with ${confPct}% confidence. Editorial pins still apply.`;
      } else if (coll.rendering_mode === 'behavioral' && !isReady) {
        recommendation = 'Fallen Back to Manual';
        detail = `Behavioral confidence ${confPct}% is below threshold ${threshold}%. Collection is using manual ordering.`;
      } else if (coll.rendering_mode === 'hybrid') {
        recommendation = 'Hybrid Active';
        detail = `${coll.manual_weight}% manual / ${coll.behavioral_weight}% behavioral blend. Confidence: ${confPct}%.`;
      } else if (confPct >= 80) {
        recommendation = 'Ready for Hybrid';
        detail = `Behavioral confidence ${confPct}% exceeds 80%. Consider enabling hybrid rendering.`;
      } else if (confPct >= threshold) {
        recommendation = 'Remain Manual';
        detail = `Confidence ${confPct}% is sufficient but collection is manually curated. Hybrid available.`;
      } else {
        recommendation = 'Remain Manual';
        detail = `Behavioral confidence ${confPct}% below threshold ${threshold}%. Engine is collecting signals silently.`;
      }

      return {
        collection_id: coll.collection_id,
        slug: coll.slug,
        title: coll.title,
        collection_type: coll.collection_type,
        rendering_mode: coll.rendering_mode,
        status: coll.status,
        behavioral_confidence: confPct,
        recommendation,
        recommendation_detail: detail,
        car_count: coll.manual_car_ids.length + coll.pinned_car_ids.length,
        pinned_count: coll.pinned_car_ids.length,
        manual_count: coll.manual_car_ids.length,
        suppressed_count: coll.suppressed_car_ids.length,
        last_rendered_at: coll.last_rendered_at,
        rising_cars: [...risingSet].slice(0, 5),
        is_behavioral_ready: isReady,
      };
    });

    const published = statuses.filter((s) => s.status === 'published');
    const avgConf =
      statuses.length > 0
        ? statuses.reduce((s, c) => s + c.behavioral_confidence, 0) / statuses.length
        : 0;

    return {
      total_collections: collections.length,
      published_collections: published.length,
      manual_mode_count: collections.filter((c) => c.rendering_mode === 'manual').length,
      hybrid_mode_count: collections.filter((c) => c.rendering_mode === 'hybrid').length,
      behavioral_mode_count: collections.filter((c) => c.rendering_mode === 'behavioral').length,
      observe_only_count: collections.filter((c) => c.rendering_mode === 'observe_only').length,
      avg_behavioral_confidence: Math.round(avgConf),
      collections_ready_for_hybrid: statuses.filter((s) => s.behavioral_confidence >= 50).length,
      collections_ready_for_behavioral: statuses.filter((s) => s.is_behavioral_ready).length,
      engine_status: engineStatus,
      collection_statuses: statuses,
    };
  }

  static async getCollectionStatus(collection_id: string): Promise<CollectionStatusEntry | null> {
    const coll = await PopularCollection.findOne({ collection_id }).lean();
    if (!coll) return null;

    const status = await CollectionStatusService.getSystemStatus();
    return status.collection_statuses.find((s) => s.collection_id === collection_id) ?? null;
  }

  private static async safeGetEngineStatus(): Promise<any> {
    try {
      return await RankingEngineService.getEngineStatus();
    } catch {
      return null;
    }
  }

  private static async safeGetRankings(): Promise<any[]> {
    try {
      return await RankingEngineService.getPopular({ entity_type: 'car', limit: 500 });
    } catch {
      return [];
    }
  }
}
