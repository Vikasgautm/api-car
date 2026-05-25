import { Document } from 'mongoose';
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
export declare const RankingSession: import("mongoose").Model<IRankingSession, {}, {}, {}, Document<unknown, {}, IRankingSession, {}, import("mongoose").DefaultSchemaOptions> & IRankingSession & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IRankingSession>;
//# sourceMappingURL=ranking-session.model.d.ts.map