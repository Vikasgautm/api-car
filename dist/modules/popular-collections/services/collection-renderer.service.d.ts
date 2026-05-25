import { IPopularCollection, IDiscoveryFilters } from '../../../models/popular-collection.model';
import { DiscoveryFilters } from '../../discovery/services/discovery.service';
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
export declare class CollectionRendererService {
    static renderCollection(slug: string, options?: CollectionRenderOptions): Promise<RenderedCollection>;
    static renderHubPreview(): Promise<HubSection[]>;
    static fetchRankingData(collection: IPopularCollection): Promise<any[]>;
    static buildDiscoveryFilters(collFilters: IDiscoveryFilters, overrides?: Partial<DiscoveryFilters>): DiscoveryFilters;
    private static applySlotSystem;
    private static applyManualSlots;
    private static applyHybridSlots;
    private static applyBehavioralSlots;
}
//# sourceMappingURL=collection-renderer.service.d.ts.map