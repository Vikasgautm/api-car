import { Document, Schema, model } from 'mongoose';

export interface RawSignals {
  qualified_attention: number;
  qualified_exploration: number;
  qualified_evaluation: number;
  qualified_commercial: number;
  qualified_retention: number;
  qualified_comparison: number;
  attention_acceleration: number;
  evaluation_acceleration: number;
  search_acceleration: number;
  commercial_acceleration: number;
}

export interface IRankingScore extends Document {
  score_id: string;
  entity_type: string;
  entity_id: string;
  popularity_score: number;
  trending_score: number;
  engagement_score: number;
  buyer_intent_score: number;
  comparison_pressure_score: number;
  retention_score: number;
  raw_signals: RawSignals;
  computed_at: Date;
  window_days: number;
  session_count: number;
  behavioral_confidence: number;
  trending_direction: 'rising' | 'stable' | 'falling';
  trending_velocity: number;
  rank_position?: number;
  is_anomaly: boolean;
  prev_popularity_score: number;
  prev_trending_score: number;
}

const rawSignalFields: Record<string, any> = {};
const rsKeys: (keyof RawSignals)[] = [
  'qualified_attention', 'qualified_exploration', 'qualified_evaluation',
  'qualified_commercial', 'qualified_retention', 'qualified_comparison',
  'attention_acceleration', 'evaluation_acceleration',
  'search_acceleration', 'commercial_acceleration',
];
rsKeys.forEach(k => { rawSignalFields[k] = { type: Number, default: 0 }; });

const schema = new Schema<IRankingScore>(
  {
    score_id: { type: String, required: true, unique: true },
    entity_type: { type: String, required: true },
    entity_id: { type: String, required: true },
    popularity_score: { type: Number, default: 0 },
    trending_score: { type: Number, default: 0 },
    engagement_score: { type: Number, default: 0 },
    buyer_intent_score: { type: Number, default: 0 },
    comparison_pressure_score: { type: Number, default: 0 },
    retention_score: { type: Number, default: 0 },
    raw_signals: rawSignalFields,
    computed_at: { type: Date, default: Date.now },
    window_days: { type: Number, default: 30 },
    session_count: { type: Number, default: 0 },
    behavioral_confidence: { type: Number, default: 0 },
    trending_direction: { type: String, default: 'stable' },
    trending_velocity: { type: Number, default: 0 },
    rank_position: { type: Number, default: null },
    is_anomaly: { type: Boolean, default: false },
    prev_popularity_score: { type: Number, default: 0 },
    prev_trending_score: { type: Number, default: 0 },
  },
  { timestamps: true }
);

schema.index({ entity_type: 1, entity_id: 1 }, { unique: true });
schema.index({ entity_type: 1, popularity_score: -1 });
schema.index({ entity_type: 1, trending_score: -1 });
schema.index({ entity_type: 1, engagement_score: -1 });
schema.index({ entity_type: 1, buyer_intent_score: -1 });
schema.index({ entity_type: 1, comparison_pressure_score: -1 });
schema.index({ entity_type: 1, retention_score: -1 });
schema.index({ behavioral_confidence: -1 });
schema.index({ computed_at: -1 });

export const RankingScore = model<IRankingScore>('RankingScore', schema);
