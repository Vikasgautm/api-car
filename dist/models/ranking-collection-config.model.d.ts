import { Document } from 'mongoose';
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
export declare const RankingCollectionConfig: import("mongoose").Model<IRankingCollectionConfig, {}, {}, {}, Document<unknown, {}, IRankingCollectionConfig, {}, import("mongoose").DefaultSchemaOptions> & IRankingCollectionConfig & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IRankingCollectionConfig>;
//# sourceMappingURL=ranking-collection-config.model.d.ts.map