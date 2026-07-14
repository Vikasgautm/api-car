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
export interface IRankingScore {
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
import { BaseModel } from '../sql/common/BaseModel';
export declare const RankingScore: BaseModel<IRankingScore>;
