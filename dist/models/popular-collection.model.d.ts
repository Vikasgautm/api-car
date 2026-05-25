import { Document } from 'mongoose';
export type CollectionType = 'trending' | 'popular' | 'ev' | 'mileage' | 'comparison' | 'family' | 'launch' | 'brand' | 'custom';
export type CollectionStatus = 'draft' | 'published' | 'archived';
export type CollectionRenderingMode = 'manual' | 'hybrid' | 'behavioral' | 'observe_only';
export type CollectionScoreType = 'popularity' | 'trending' | 'engagement' | 'buyer_intent' | 'comparison_pressure' | 'retention' | 'manual';
export interface IDiscoveryFilters {
    body_type_slugs?: string[];
    fuel_type_slugs?: string[];
    brand_slugs?: string[];
    lifecycle_stages?: string[];
    min_price?: number;
    max_price?: number;
    transmission?: string[];
    seating_min?: number;
    seating_max?: number;
    tags?: string[];
    has_adas?: boolean;
    has_sunroof?: boolean;
    mileage_class?: string[];
    is_electric?: boolean;
    vehicle_segment?: string[];
    family_friendly?: boolean;
}
export interface IPopularCollection extends Document {
    collection_id: string;
    slug: string;
    title: string;
    subtitle?: string;
    description?: string;
    collection_type: CollectionType;
    status: CollectionStatus;
    discovery_filters: IDiscoveryFilters;
    default_sort: string;
    ranking_collection_key?: string;
    primary_score_type: CollectionScoreType;
    rendering_mode: CollectionRenderingMode;
    manual_weight: number;
    behavioral_weight: number;
    min_behavioral_confidence: number;
    pinned_car_ids: string[];
    manual_car_ids: string[];
    suppressed_car_ids: string[];
    hub_preview_limit: number;
    collection_page_limit: number;
    display_on_hub: boolean;
    hub_section_order: number;
    hub_section_label?: string;
    view_all_path: string;
    seo_h1?: string;
    seo_meta_title?: string;
    seo_meta_description?: string;
    seo_intro_content?: string;
    seo_conclusion_content?: string;
    seo_noindex: boolean;
    seo_canonical_url?: string;
    related_collection_slugs: string[];
    created_by?: string;
    updated_by?: string;
    last_rendered_at?: Date;
}
export declare const PopularCollection: import("mongoose").Model<IPopularCollection, {}, {}, {}, Document<unknown, {}, IPopularCollection, {}, import("mongoose").DefaultSchemaOptions> & IPopularCollection & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPopularCollection>;
//# sourceMappingURL=popular-collection.model.d.ts.map