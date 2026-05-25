import { Document, Schema, model } from 'mongoose';

export type RankingEventType =
  | 'page_view' | 'page_exit' | 'scroll'
  | 'spec_interaction' | 'variant_open' | 'variant_switch' | 'variant_compare'
  | 'compare_open' | 'compare_interaction'
  | 'gallery_open' | 'gallery_zoom'
  | 'faq_expand' | 'faq_read'
  | 'emi_open' | 'emi_calculate' | 'emi_customize'
  | 'brochure_click' | 'brochure_download'
  | 'wishlist_add' | 'wishlist_remove'
  | 'city_price_lookup' | 'dealer_view' | 'dealer_contact'
  | 'search_query' | 'search_click'
  | 'filter_apply' | 'share_click' | 'return_visit';

export const VALID_EVENT_TYPES: RankingEventType[] = [
  'page_view', 'page_exit', 'scroll',
  'spec_interaction', 'variant_open', 'variant_switch', 'variant_compare',
  'compare_open', 'compare_interaction',
  'gallery_open', 'gallery_zoom',
  'faq_expand', 'faq_read',
  'emi_open', 'emi_calculate', 'emi_customize',
  'brochure_click', 'brochure_download',
  'wishlist_add', 'wishlist_remove',
  'city_price_lookup', 'dealer_view', 'dealer_contact',
  'search_query', 'search_click',
  'filter_apply', 'share_click', 'return_visit',
];

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

const schema = new Schema<IRankingRawEvent>(
  {
    event_id: { type: String, required: true, unique: true },
    event_type: { type: String, required: true },
    entity_type: { type: String, required: true },
    entity_id: { type: String, required: true },
    variant_id: { type: String, default: null },
    session_id: { type: String, required: true },
    user_id: { type: String, default: null },
    anonymous_id: { type: String, default: null },
    timestamp: { type: Date, required: true },
    page_url: { type: String, default: null },
    referrer: { type: String, default: null },
    traffic_source: { type: String, default: null },
    device_type: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    active_tab: { type: Boolean, default: true },
    duration_ms: { type: Number, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    event_confidence_score: { type: Number, default: 0 },
    is_validated: { type: Boolean, default: false },
  },
  { timestamps: false }
);

schema.index({ entity_id: 1, timestamp: -1 });
schema.index({ session_id: 1, timestamp: 1 });
schema.index({ event_type: 1, timestamp: -1 });
schema.index({ timestamp: -1 });
schema.index({ timestamp: 1 }, { expireAfterSeconds: 180 * 24 * 3600 });

export const RankingRawEvent = model<IRankingRawEvent>('RankingRawEvent', schema);
