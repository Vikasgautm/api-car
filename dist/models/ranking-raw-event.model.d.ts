import { Document } from 'mongoose';
export type RankingEventType = 'page_view' | 'page_exit' | 'scroll' | 'spec_interaction' | 'variant_open' | 'variant_switch' | 'variant_compare' | 'compare_open' | 'compare_interaction' | 'gallery_open' | 'gallery_zoom' | 'faq_expand' | 'faq_read' | 'emi_open' | 'emi_calculate' | 'emi_customize' | 'brochure_click' | 'brochure_download' | 'wishlist_add' | 'wishlist_remove' | 'city_price_lookup' | 'dealer_view' | 'dealer_contact' | 'search_query' | 'search_click' | 'filter_apply' | 'share_click' | 'return_visit';
export declare const VALID_EVENT_TYPES: RankingEventType[];
export interface IRankingRawEvent extends Document {
    event_id: string;
    event_type: RankingEventType;
    entity_type: string;
    entity_id: string;
    variant_id?: string;
    session_id: string;
    user_id?: string;
    anonymous_id?: string;
    timestamp: Date;
    page_url?: string;
    referrer?: string;
    traffic_source?: string;
    device_type?: string;
    city?: string;
    state?: string;
    active_tab: boolean;
    duration_ms?: number;
    metadata: Record<string, any>;
    event_confidence_score: number;
    is_validated: boolean;
}
export declare const RankingRawEvent: import("mongoose").Model<IRankingRawEvent, {}, {}, {}, Document<unknown, {}, IRankingRawEvent, {}, import("mongoose").DefaultSchemaOptions> & IRankingRawEvent & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IRankingRawEvent>;
//# sourceMappingURL=ranking-raw-event.model.d.ts.map