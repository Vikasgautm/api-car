interface IMediaItem {
    url: string;
    alt?: string;
    public_id?: string;
}
export interface IBrandAggregatesCache {
    total_cars: number;
    total_variants: number;
    body_type_distribution: Array<{
        type_id: string;
        type_name: string;
        slug: string;
        count: number;
        preview_cars: string[];
    }>;
    fuel_type_distribution: Array<{
        fuel_id: string;
        fuel_name: string;
        slug: string;
        count: number;
        preview_cars: string[];
    }>;
    price_range: {
        min: number;
        max: number;
        min_car_name: string;
        max_car_name: string;
        min_car_id?: string;
        max_car_id?: string;
    } | null;
    feature_counts: {
        adas: number;
        sunroof: number;
    };
    has_ev: boolean;
    has_cng: boolean;
    last_computed_at: Date;
}
export interface IBrand {
    brand_id: string;
    name: string;
    alias?: string;
    slug: string;
    slug_history: Array<{
        slug: string;
        changed_at: Date;
    }>;
    short_description?: string;
    description?: string;
    founded_year?: number;
    country?: string;
    parent_company?: string;
    logo?: {
        title?: string;
        url: string;
    };
    brand_media?: {
        primary_logo?: IMediaItem;
        svg_logo?: IMediaItem;
        hero_banner?: IMediaItem;
        thumbnail?: IMediaItem;
        mobile_banner?: IMediaItem;
    };
    website?: string;
    is_published: boolean;
    is_deleted: boolean;
    is_featured?: boolean;
    is_upcoming?: boolean;
    is_discontinued?: boolean;
    aggregates_cache?: IBrandAggregatesCache;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    og_image?: string;
    canonical_url?: string;
    noindex?: boolean;
}
import { BaseModel } from '../sql/common/BaseModel';
export declare const Brand: BaseModel<IBrand>;
export {};
