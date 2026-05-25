import { IRankingScore } from '../../../models/ranking-score.model';
import { IRankingCollectionConfig, RenderingMode } from '../../../models/ranking-collection-config.model';
interface RankingQueryParams {
    entity_type?: string;
    brand_id?: string;
    body_type_id?: string;
    fuel_type_id?: string;
    min_price?: number;
    max_price?: number;
    lifecycle_stage?: string;
    city?: string;
    seating?: number;
    limit?: number;
    window_days?: number;
}
interface RankedEntity {
    entity_id: string;
    entity_type: string;
    score: number;
    rank: number;
    behavioral_confidence: number;
    trending_direction: 'rising' | 'stable' | 'falling';
    trending_velocity: number;
    score_breakdown?: Partial<IRankingScore>;
}
interface EngineStatus {
    total_entities_scored: number;
    avg_behavioral_confidence: number;
    high_confidence_count: number;
    rising_entities: string[];
    weak_collections: string[];
    last_recompute?: Date;
    session_count_30d: number;
    rendering_mode_distribution: Record<string, number>;
}
export declare class RankingEngineService {
    static recomputeAllScores(windowDays?: number): Promise<void>;
    private static computePopularityScore;
    private static computeTrendingScore;
    private static computeEngagementScore;
    private static computeBuyerIntentScore;
    private static computeComparisonPressureScore;
    private static computeRetentionScore;
    private static computeDecayFactor;
    private static percentileNormalize;
    static generateSnapshot(scoreType: IRankingScore['trending_direction'] extends string ? any : never, entityType?: string, filterContext?: Record<string, any>, windowDays?: number, limit?: number): Promise<void>;
    static getPopular(params: RankingQueryParams): Promise<RankedEntity[]>;
    static getTrending(params: RankingQueryParams): Promise<RankedEntity[]>;
    static getByEngagement(params: RankingQueryParams): Promise<RankedEntity[]>;
    static getByBuyerIntent(params: RankingQueryParams): Promise<RankedEntity[]>;
    static getByComparison(params: RankingQueryParams): Promise<RankedEntity[]>;
    static getByRetention(params: RankingQueryParams): Promise<RankedEntity[]>;
    private static queryScores;
    static getCollectionRanking(collectionKey: string, candidateEntityIds: string[], entityType?: string): Promise<{
        entity_ids: string[];
        rendering_mode: RenderingMode;
        behavioral_confidence: number;
    }>;
    static getEngineStatus(): Promise<EngineStatus>;
    static listCollectionConfigs(): Promise<(IRankingCollectionConfig & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static getCollectionConfig(collectionKey: string): Promise<(IRankingCollectionConfig & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    static upsertCollectionConfig(data: Partial<IRankingCollectionConfig> & {
        collection_key: string;
        collection_label: string;
    }): Promise<import("mongoose").Document<unknown, {}, IRankingCollectionConfig, {}, import("mongoose").DefaultSchemaOptions> & IRankingCollectionConfig & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static getScoreInspector(entityId: string): Promise<{
        score: IRankingScore & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
        top_sessions: (import("../../../models/ranking-session.model").IRankingSession & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        recent_snapshots: (import("../../../models/ranking-rank-snapshot.model").IRankingRankSnapshot & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    } | null>;
    private static scoreTypeToField;
}
export {};
//# sourceMappingURL=ranking-engine.service.d.ts.map