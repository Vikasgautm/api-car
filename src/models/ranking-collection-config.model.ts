import { Document, Schema, model } from 'mongoose';

export type RenderingMode = 'manual' | 'hybrid' | 'behavioral' | 'observe_only';

export type ScoreType = 'popularity' | 'trending' | 'engagement' | 'buyer_intent' | 'comparison_pressure' | 'retention';

export interface EditorialBoost {
  entity_id: string;
  boost_score: number;
  expires_at?: Date;
  reason?: string;
}

export interface IRankingCollectionConfig extends Document {
  config_id: string;
  collection_key: string;
  collection_label: string;
  collection_category: string;
  rendering_mode: RenderingMode;
  manual_weight: number;
  behavioral_weight: number;
  min_behavioral_confidence: number;
  score_type: ScoreType;
  filter_context: Record<string, any>;
  pinned_entity_ids: string[];
  suppressed_entity_ids: string[];
  editorial_boosts: EditorialBoost[];
  is_active: boolean;
  notes?: string;
}

const schema = new Schema<IRankingCollectionConfig>(
  {
    config_id: { type: String, required: true, unique: true },
    collection_key: { type: String, required: true, unique: true },
    collection_label: { type: String, required: true },
    collection_category: { type: String, default: 'general' },
    rendering_mode: { type: String, default: 'observe_only' },
    manual_weight: { type: Number, default: 70, min: 0, max: 100 },
    behavioral_weight: { type: Number, default: 30, min: 0, max: 100 },
    min_behavioral_confidence: { type: Number, default: 70, min: 0, max: 100 },
    score_type: { type: String, default: 'popularity' },
    filter_context: { type: Schema.Types.Mixed, default: {} },
    pinned_entity_ids: [{ type: String }],
    suppressed_entity_ids: [{ type: String }],
    editorial_boosts: [
      {
        entity_id: { type: String },
        boost_score: { type: Number },
        expires_at: { type: Date, default: null },
        reason: { type: String, default: null },
      },
    ],
    is_active: { type: Boolean, default: true },
    notes: { type: String, default: null },
  },
  { timestamps: true }
);

schema.index({ collection_key: 1 });
schema.index({ rendering_mode: 1 });
schema.index({ is_active: 1 });

export const RankingCollectionConfig = model<IRankingCollectionConfig>('RankingCollectionConfig', schema);
