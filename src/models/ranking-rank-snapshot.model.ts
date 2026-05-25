import { Document, Schema, model } from 'mongoose';

export interface SnapshotEntry {
  entity_id: string;
  entity_type: string;
  rank: number;
  score: number;
  behavioral_confidence: number;
  trending_direction: 'rising' | 'stable' | 'falling';
  trending_velocity: number;
}

export interface IRankingRankSnapshot extends Document {
  snapshot_id: string;
  score_type: 'popularity' | 'trending' | 'engagement' | 'buyer_intent' | 'comparison_pressure' | 'retention';
  entity_type: string;
  filter_context: Record<string, any>;
  entries: SnapshotEntry[];
  generated_at: Date;
  window_days: number;
  total_entities: number;
  avg_confidence: number;
}

const schema = new Schema<IRankingRankSnapshot>(
  {
    snapshot_id: { type: String, required: true, unique: true },
    score_type: { type: String, required: true },
    entity_type: { type: String, required: true, default: 'car' },
    filter_context: { type: Schema.Types.Mixed, default: {} },
    entries: [
      {
        entity_id: { type: String },
        entity_type: { type: String },
        rank: { type: Number },
        score: { type: Number },
        behavioral_confidence: { type: Number },
        trending_direction: { type: String },
        trending_velocity: { type: Number, default: 0 },
      },
    ],
    generated_at: { type: Date, default: Date.now },
    window_days: { type: Number, default: 30 },
    total_entities: { type: Number, default: 0 },
    avg_confidence: { type: Number, default: 0 },
  },
  { timestamps: false }
);

schema.index({ score_type: 1, entity_type: 1, generated_at: -1 });
schema.index({ generated_at: -1 });
schema.index({ generated_at: 1 }, { expireAfterSeconds: 365 * 24 * 3600 });

export const RankingRankSnapshot = model<IRankingRankSnapshot>('RankingRankSnapshot', schema);
