import { Document, Schema, model } from 'mongoose';

export interface SessionSignals {
  attention_strength: number;
  exploration_strength: number;
  evaluation_strength: number;
  commercial_strength: number;
  noise_penalty: number;
  time_confidence: number;
  scroll_confidence: number;
  revisit_confidence: number;
  spec_depth_score: number;
  gallery_depth_score: number;
  faq_depth_score: number;
  feature_tool_depth_score: number;
  comparison_depth_score: number;
  variant_analysis_score: number;
  repeat_evaluation_score: number;
  emi_confidence: number;
  brochure_confidence: number;
  dealer_confidence: number;
}

export interface IRankingSession extends Document {
  session_id: string;
  user_id?: string;
  anonymous_id?: string;
  entity_ids: string[];
  primary_entity_id?: string;
  started_at: Date;
  ended_at?: Date;
  is_active: boolean;
  last_event_at: Date;
  event_count: number;
  validated_event_count: number;
  active_seconds: number;
  session_quality_score: number;
  session_confidence: number;
  signals: SessionSignals;
  device_type?: string;
  city?: string;
  state?: string;
  traffic_source?: string;
  is_bounce: boolean;
  has_comparison: boolean;
  has_commercial_intent: boolean;
}

const signalFields: Record<string, any> = {};
const signalKeys: (keyof SessionSignals)[] = [
  'attention_strength', 'exploration_strength', 'evaluation_strength',
  'commercial_strength', 'noise_penalty', 'time_confidence', 'scroll_confidence',
  'revisit_confidence', 'spec_depth_score', 'gallery_depth_score',
  'faq_depth_score', 'feature_tool_depth_score', 'comparison_depth_score',
  'variant_analysis_score', 'repeat_evaluation_score', 'emi_confidence',
  'brochure_confidence', 'dealer_confidence',
];
signalKeys.forEach(k => { signalFields[k] = { type: Number, default: 0 }; });

const schema = new Schema<IRankingSession>(
  {
    session_id: { type: String, required: true, unique: true },
    user_id: { type: String, default: null },
    anonymous_id: { type: String, default: null },
    entity_ids: [{ type: String }],
    primary_entity_id: { type: String, default: null },
    started_at: { type: Date, required: true },
    ended_at: { type: Date, default: null },
    is_active: { type: Boolean, default: true },
    last_event_at: { type: Date, required: true },
    event_count: { type: Number, default: 0 },
    validated_event_count: { type: Number, default: 0 },
    active_seconds: { type: Number, default: 0 },
    session_quality_score: { type: Number, default: 0 },
    session_confidence: { type: Number, default: 0 },
    signals: signalFields,
    device_type: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    traffic_source: { type: String, default: null },
    is_bounce: { type: Boolean, default: false },
    has_comparison: { type: Boolean, default: false },
    has_commercial_intent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

schema.index({ entity_ids: 1, started_at: -1 });
schema.index({ primary_entity_id: 1, started_at: -1 });
schema.index({ is_active: 1, last_event_at: 1 });
schema.index({ session_quality_score: -1 });
schema.index({ started_at: -1 });
schema.index({ started_at: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

export const RankingSession = model<IRankingSession>('RankingSession', schema);
