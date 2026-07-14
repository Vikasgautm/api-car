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
export declare class CollectionStatusService {
    static getSystemStatus(): Promise<SystemEngineStatus>;
    static getCollectionStatus(collection_id: string): Promise<CollectionStatusEntry | null>;
    private static safeGetEngineStatus;
    private static safeGetRankings;
}
