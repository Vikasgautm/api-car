import { Document } from 'mongoose';
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
export declare const RankingRankSnapshot: import("mongoose").Model<IRankingRankSnapshot, {}, {}, {}, Document<unknown, {}, IRankingRankSnapshot, {}, import("mongoose").DefaultSchemaOptions> & IRankingRankSnapshot & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IRankingRankSnapshot>;
//# sourceMappingURL=ranking-rank-snapshot.model.d.ts.map