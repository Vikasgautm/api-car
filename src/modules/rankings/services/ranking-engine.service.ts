import { v4 as uuidv4 } from 'uuid';
import { RankingSession } from '../../../models/ranking-session.model';
import { RankingScore, IRankingScore } from '../../../models/ranking-score.model';
import { RankingRankSnapshot } from '../../../models/ranking-rank-snapshot.model';
import { RankingCollectionConfig, IRankingCollectionConfig, RenderingMode } from '../../../models/ranking-collection-config.model';
import { SessionQualityService } from './session-quality.service';

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

const DECAY_HALF_LIFE_DAYS = 14; // scores halve every 14 days without new activity

export class RankingEngineService {
  // ── SCORE RECOMPUTATION ───────────────────────────────────────────────────

  static async recomputeAllScores(windowDays = 30): Promise<void> {
    const since = new Date(Date.now() - windowDays * 24 * 3600 * 1000);

    // Close stale active sessions first
    const staleThreshold = new Date(Date.now() - 30 * 60 * 1000);
    await RankingSession.updateMany(
      { is_active: true, last_event_at: { $lt: staleThreshold } },
      { $set: { is_active: false, ended_at: staleThreshold } }
    );

    // Fetch all closed sessions in window
    const sessions = await RankingSession.find({
      started_at: { $gte: since },
      is_active: false,
      is_bounce: false,
      session_quality_score: { $gt: 0 },
    }).lean();

    // Group sessions by entity_id
    const entitySessions: Map<string, { entity_type: string; sessions: typeof sessions }> = new Map();

    for (const session of sessions) {
      for (const entityId of session.entity_ids) {
        if (!entitySessions.has(entityId)) {
          entitySessions.set(entityId, { entity_type: 'car', sessions: [] });
        }
        entitySessions.get(entityId)!.sessions.push(session);
      }
    }

    // For each entity, compute aggregated signals
    const rawSignalsByEntity: Map<string, {
      entity_type: string;
      sessions: typeof sessions;
      totalQuality: number;
      totalAttention: number;
      totalExploration: number;
      totalEvaluation: number;
      totalCommercial: number;
      totalRetention: number;
      totalComparison: number;
      sessionCount: number;
    }> = new Map();

    for (const [entityId, data] of entitySessions) {
      let totalQuality = 0, totalAttention = 0, totalExploration = 0;
      let totalEvaluation = 0, totalCommercial = 0, totalRetention = 0, totalComparison = 0;

      for (const s of data.sessions) {
        const decay = this.computeDecayFactor(new Date(s.started_at), windowDays);
        const w = decay * (s.session_confidence ?? 0.5);

        totalQuality += s.session_quality_score * w;
        totalAttention += (s.signals?.attention_strength ?? 0) * w;
        totalExploration += (s.signals?.exploration_strength ?? 0) * w;
        totalEvaluation += (s.signals?.evaluation_strength ?? 0) * w;
        totalCommercial += (s.signals?.commercial_strength ?? 0) * w;
        totalRetention += s.session_quality_score > 60 ? w : 0;
        totalComparison += (s.signals?.comparison_depth_score ?? 0) * w;
      }

      rawSignalsByEntity.set(entityId, {
        entity_type: data.entity_type,
        sessions: data.sessions,
        totalQuality,
        totalAttention,
        totalExploration,
        totalEvaluation,
        totalCommercial,
        totalRetention,
        totalComparison,
        sessionCount: data.sessions.length,
      });
    }

    if (rawSignalsByEntity.size === 0) return;

    // Percentile normalization
    const normalizedSignals = this.percentileNormalize(rawSignalsByEntity);

    // Compute previous scores for trend
    const prevScores = await RankingScore.find({
      entity_type: 'car',
    }).lean();
    const prevMap = new Map(prevScores.map(s => [s.entity_id, s]));

    // Upsert scores
    for (const [entityId, norm] of normalizedSignals) {
      const data = rawSignalsByEntity.get(entityId)!;
      const prev = prevMap.get(entityId);

      const popularity_score = this.computePopularityScore(norm);
      const trending_score = this.computeTrendingScore(norm);
      const engagement_score = this.computeEngagementScore(norm);
      const buyer_intent_score = this.computeBuyerIntentScore(norm);
      const comparison_pressure_score = this.computeComparisonPressureScore(norm);
      const retention_score = this.computeRetentionScore(norm);

      const trending_velocity = prev ? popularity_score - prev.popularity_score : 0;
      const trending_direction: 'rising' | 'stable' | 'falling' =
        trending_velocity > 5 ? 'rising' : trending_velocity < -5 ? 'falling' : 'stable';

      // Behavioral confidence = session count + quality factor
      const behavioral_confidence = Math.min(100,
        (Math.log(data.sessionCount + 1) / Math.log(101)) * 60 + // up to 60 from session volume
        (norm.qualityNorm) * 40 // up to 40 from quality
      );

      await RankingScore.findOneAndUpdate(
        { entity_type: data.entity_type, entity_id: entityId },
        {
          $set: {
            score_id: uuidv4(),
            entity_type: data.entity_type,
            entity_id: entityId,
            popularity_score,
            trending_score,
            engagement_score,
            buyer_intent_score,
            comparison_pressure_score,
            retention_score,
            raw_signals: {
              qualified_attention: norm.attentionNorm,
              qualified_exploration: norm.explorationNorm,
              qualified_evaluation: norm.evaluationNorm,
              qualified_commercial: norm.commercialNorm,
              qualified_retention: norm.retentionNorm,
              qualified_comparison: norm.comparisonNorm,
              attention_acceleration: 0,
              evaluation_acceleration: 0,
              search_acceleration: 0,
              commercial_acceleration: 0,
            },
            computed_at: new Date(),
            window_days: windowDays,
            session_count: data.sessionCount,
            behavioral_confidence,
            trending_direction,
            trending_velocity,
            prev_popularity_score: prev?.popularity_score ?? 0,
            prev_trending_score: prev?.trending_score ?? 0,
            is_anomaly: false,
          },
        },
        { upsert: true, returnDocument: 'after' }
      );
    }
  }

  // ── SCORE FORMULAS ────────────────────────────────────────────────────────

  private static computePopularityScore(norm: NormalizedSignals): number {
    return Math.min(100,
      norm.attentionNorm * 35 +
      norm.evaluationNorm * 30 +
      norm.retentionNorm * 20 +
      norm.commercialNorm * 15
    );
  }

  private static computeTrendingScore(norm: NormalizedSignals): number {
    // For trending, we weight acceleration — use raw norm as proxy for now
    // Phase 2 will add proper window-over-window acceleration
    return Math.min(100,
      norm.attentionNorm * 40 +
      norm.evaluationNorm * 30 +
      norm.qualityNorm * 20 +
      norm.commercialNorm * 10
    );
  }

  private static computeEngagementScore(norm: NormalizedSignals): number {
    return Math.min(100,
      norm.explorationNorm * 40 +
      norm.attentionNorm * 30 +
      norm.evaluationNorm * 20 +
      norm.retentionNorm * 10
    );
  }

  private static computeBuyerIntentScore(norm: NormalizedSignals): number {
    return Math.min(100,
      norm.commercialNorm * 50 +
      norm.evaluationNorm * 25 +
      norm.retentionNorm * 15 +
      norm.attentionNorm * 10
    );
  }

  private static computeComparisonPressureScore(norm: NormalizedSignals): number {
    return Math.min(100,
      norm.comparisonNorm * 60 +
      norm.evaluationNorm * 25 +
      norm.qualityNorm * 15
    );
  }

  private static computeRetentionScore(norm: NormalizedSignals): number {
    return Math.min(100,
      norm.retentionNorm * 50 +
      norm.qualityNorm * 30 +
      norm.attentionNorm * 20
    );
  }

  // ── DECAY ─────────────────────────────────────────────────────────────────

  private static computeDecayFactor(sessionDate: Date, windowDays: number): number {
    const ageMs = Date.now() - sessionDate.getTime();
    const ageDays = ageMs / (24 * 3600 * 1000);
    // Exponential decay: f(t) = e^(-λt), λ = ln(2)/half_life
    const lambda = Math.LN2 / DECAY_HALF_LIFE_DAYS;
    return Math.exp(-lambda * ageDays);
  }

  // ── PERCENTILE NORMALIZATION ───────────────────────────────────────────────

  private static percentileNormalize(
    entityMap: Map<string, {
      totalQuality: number; totalAttention: number; totalExploration: number;
      totalEvaluation: number; totalCommercial: number; totalRetention: number;
      totalComparison: number;
    }>
  ): Map<string, NormalizedSignals> {
    const entities = Array.from(entityMap.entries());

    const rank = (values: number[], val: number): number => {
      const sorted = [...values].sort((a, b) => a - b);
      const idx = sorted.findIndex(v => v >= val);
      return idx < 0 ? 100 : Math.round((idx / sorted.length) * 100);
    };

    const attentions = entities.map(([, d]) => d.totalAttention);
    const explorations = entities.map(([, d]) => d.totalExploration);
    const evaluations = entities.map(([, d]) => d.totalEvaluation);
    const commercials = entities.map(([, d]) => d.totalCommercial);
    const retentions = entities.map(([, d]) => d.totalRetention);
    const comparisons = entities.map(([, d]) => d.totalComparison);
    const qualities = entities.map(([, d]) => d.totalQuality);

    const result = new Map<string, NormalizedSignals>();
    for (const [entityId, data] of entities) {
      result.set(entityId, {
        attentionNorm: rank(attentions, data.totalAttention) / 100,
        explorationNorm: rank(explorations, data.totalExploration) / 100,
        evaluationNorm: rank(evaluations, data.totalEvaluation) / 100,
        commercialNorm: rank(commercials, data.totalCommercial) / 100,
        retentionNorm: rank(retentions, data.totalRetention) / 100,
        comparisonNorm: rank(comparisons, data.totalComparison) / 100,
        qualityNorm: rank(qualities, data.totalQuality) / 100,
      });
    }
    return result;
  }

  // ── SNAPSHOT GENERATION ────────────────────────────────────────────────────

  static async generateSnapshot(
    scoreType: IRankingScore['trending_direction'] extends string ? any : never,
    entityType = 'car',
    filterContext: Record<string, any> = {},
    windowDays = 30,
    limit = 50
  ): Promise<void> {
    const scoreField = this.scoreTypeToField(scoreType);
    const query: Record<string, any> = { entity_type: entityType };

    const scores = await RankingScore.find(query)
      .sort({ [scoreField]: -1 })
      .limit(limit)
      .lean();

    if (scores.length === 0) return;

    const avgConfidence = scores.reduce((s, r) => s + r.behavioral_confidence, 0) / scores.length;

    await RankingRankSnapshot.create({
      snapshot_id: uuidv4(),
      score_type: scoreType,
      entity_type: entityType,
      filter_context: filterContext,
      entries: scores.map((s, idx) => ({
        entity_id: s.entity_id,
        entity_type: s.entity_type,
        rank: idx + 1,
        score: (s as any)[scoreField],
        behavioral_confidence: s.behavioral_confidence,
        trending_direction: s.trending_direction,
        trending_velocity: s.trending_velocity,
      })),
      generated_at: new Date(),
      window_days: windowDays,
      total_entities: scores.length,
      avg_confidence: avgConfidence,
    });
  }

  // ── RANKING QUERY APIS ────────────────────────────────────────────────────

  static async getPopular(params: RankingQueryParams): Promise<RankedEntity[]> {
    return this.queryScores('popularity_score', params);
  }

  static async getTrending(params: RankingQueryParams): Promise<RankedEntity[]> {
    return this.queryScores('trending_score', params);
  }

  static async getByEngagement(params: RankingQueryParams): Promise<RankedEntity[]> {
    return this.queryScores('engagement_score', params);
  }

  static async getByBuyerIntent(params: RankingQueryParams): Promise<RankedEntity[]> {
    return this.queryScores('buyer_intent_score', params);
  }

  static async getByComparison(params: RankingQueryParams): Promise<RankedEntity[]> {
    return this.queryScores('comparison_pressure_score', params);
  }

  static async getByRetention(params: RankingQueryParams): Promise<RankedEntity[]> {
    return this.queryScores('retention_score', params);
  }

  private static async queryScores(
    sortField: string,
    params: RankingQueryParams
  ): Promise<RankedEntity[]> {
    const query: Record<string, any> = {
      entity_type: params.entity_type ?? 'car',
    };

    const limit = Math.min(params.limit ?? 20, 100);

    const scores = await RankingScore.find(query)
      .sort({ [sortField]: -1 })
      .limit(limit)
      .lean();

    return scores.map((s, idx) => ({
      entity_id: s.entity_id,
      entity_type: s.entity_type,
      score: (s as any)[sortField],
      rank: idx + 1,
      behavioral_confidence: s.behavioral_confidence,
      trending_direction: s.trending_direction,
      trending_velocity: s.trending_velocity,
    }));
  }

  // ── COLLECTION RENDERING ──────────────────────────────────────────────────

  static async getCollectionRanking(
    collectionKey: string,
    candidateEntityIds: string[],
    entityType = 'car'
  ): Promise<{ entity_ids: string[]; rendering_mode: RenderingMode; behavioral_confidence: number }> {
    const config = await RankingCollectionConfig.findOne({ collection_key: collectionKey, is_active: true }).lean();

    const mode: RenderingMode = config?.rendering_mode ?? 'manual';

    if (mode === 'manual' || mode === 'observe_only') {
      return { entity_ids: candidateEntityIds, rendering_mode: mode, behavioral_confidence: 0 };
    }

    const scores = await RankingScore.find({
      entity_type: entityType,
      entity_id: { $in: candidateEntityIds },
    }).lean();

    if (scores.length === 0) {
      return { entity_ids: candidateEntityIds, rendering_mode: 'manual', behavioral_confidence: 0 };
    }

    const avgConfidence = scores.reduce((s, r) => s + r.behavioral_confidence, 0) / scores.length;
    const minConfidence = config?.min_behavioral_confidence ?? 70;

    if (avgConfidence < minConfidence) {
      return { entity_ids: candidateEntityIds, rendering_mode: 'manual', behavioral_confidence: avgConfidence };
    }

    const scoreField = this.scoreTypeToField(config?.score_type ?? 'popularity');
    const scoreMap = new Map(scores.map(s => [s.entity_id, (s as any)[scoreField] as number]));

    // Apply suppressions and pins
    const suppressed = new Set(config?.suppressed_entity_ids ?? []);
    const pinned = config?.pinned_entity_ids ?? [];
    const boostMap = new Map((config?.editorial_boosts ?? [])
      .filter(b => !b.expires_at || new Date(b.expires_at) > new Date())
      .map(b => [b.entity_id, b.boost_score])
    );

    const eligible = candidateEntityIds.filter(id => !suppressed.has(id) && !pinned.includes(id));

    if (mode === 'behavioral') {
      eligible.sort((a, b) => {
        const sa = (scoreMap.get(a) ?? 0) + (boostMap.get(a) ?? 0);
        const sb = (scoreMap.get(b) ?? 0) + (boostMap.get(b) ?? 0);
        return sb - sa;
      });
      return { entity_ids: [...pinned, ...eligible], rendering_mode: mode, behavioral_confidence: avgConfidence };
    }

    // hybrid
    const manualW = (config?.manual_weight ?? 70) / 100;
    const behavW = (config?.behavioral_weight ?? 30) / 100;

    const orderedManual = candidateEntityIds.filter(id => !suppressed.has(id) && !pinned.includes(id));
    const positionMap = new Map(orderedManual.map((id, idx) => [id, idx]));

    eligible.sort((a, b) => {
      const manualA = (1 - (positionMap.get(a) ?? 0) / Math.max(1, orderedManual.length)) * manualW;
      const manualB = (1 - (positionMap.get(b) ?? 0) / Math.max(1, orderedManual.length)) * manualW;
      const behavA = ((scoreMap.get(a) ?? 0) / 100) * behavW + (boostMap.get(a) ?? 0) / 100;
      const behavB = ((scoreMap.get(b) ?? 0) / 100) * behavW + (boostMap.get(b) ?? 0) / 100;
      return (manualB + behavB) - (manualA + behavA);
    });

    return { entity_ids: [...pinned, ...eligible], rendering_mode: mode, behavioral_confidence: avgConfidence };
  }

  // ── ENGINE STATUS ─────────────────────────────────────────────────────────

  static async getEngineStatus(): Promise<EngineStatus> {
    const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const [totalScored, sessionCount, configs] = await Promise.all([
      RankingScore.countDocuments({}),
      RankingSession.countDocuments({ started_at: { $gte: since30d }, is_bounce: false }),
      RankingCollectionConfig.find({ is_active: true }).lean(),
    ]);

    const scores = await RankingScore.find({}).select('behavioral_confidence trending_direction entity_id').lean();

    const avgConfidence = scores.length > 0
      ? scores.reduce((s, r) => s + r.behavioral_confidence, 0) / scores.length
      : 0;

    const highConfidenceCount = scores.filter(s => s.behavioral_confidence >= 70).length;
    const rising = scores.filter(s => s.trending_direction === 'rising').map(s => s.entity_id).slice(0, 10);

    const lastScore = await RankingScore.findOne({}).sort({ computed_at: -1 }).select('computed_at').lean();

    const modeDistribution: Record<string, number> = {};
    for (const c of configs) {
      modeDistribution[c.rendering_mode] = (modeDistribution[c.rendering_mode] ?? 0) + 1;
    }

    const weakCollections = configs
      .filter(c => c.rendering_mode !== 'manual' && c.rendering_mode !== 'observe_only')
      .map(c => c.collection_key);

    return {
      total_entities_scored: totalScored,
      avg_behavioral_confidence: Math.round(avgConfidence),
      high_confidence_count: highConfidenceCount,
      rising_entities: rising,
      weak_collections: weakCollections.slice(0, 5),
      last_recompute: lastScore?.computed_at,
      session_count_30d: sessionCount,
      rendering_mode_distribution: modeDistribution,
    };
  }

  // ── COLLECTION CONFIG CRUD ────────────────────────────────────────────────

  static async listCollectionConfigs() {
    return RankingCollectionConfig.find({}).sort({ collection_label: 1 }).lean();
  }

  static async getCollectionConfig(collectionKey: string) {
    return RankingCollectionConfig.findOne({ collection_key: collectionKey }).lean();
  }

  static async upsertCollectionConfig(data: Partial<IRankingCollectionConfig> & { collection_key: string; collection_label: string }) {
    return RankingCollectionConfig.findOneAndUpdate(
      { collection_key: data.collection_key },
      {
        $set: {
          config_id: data.config_id ?? uuidv4(),
          collection_label: data.collection_label,
          collection_category: data.collection_category ?? 'general',
          rendering_mode: data.rendering_mode ?? 'observe_only',
          manual_weight: data.manual_weight ?? 70,
          behavioral_weight: data.behavioral_weight ?? 30,
          min_behavioral_confidence: data.min_behavioral_confidence ?? 70,
          score_type: data.score_type ?? 'popularity',
          filter_context: data.filter_context ?? {},
          pinned_entity_ids: data.pinned_entity_ids ?? [],
          suppressed_entity_ids: data.suppressed_entity_ids ?? [],
          editorial_boosts: data.editorial_boosts ?? [],
          is_active: data.is_active !== false,
          notes: data.notes ?? null,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
  }

  static async getScoreInspector(entityId: string) {
    const score = await RankingScore.findOne({ entity_id: entityId }).lean();
    if (!score) return null;

    const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const sessions = await RankingSession.find({
      entity_ids: entityId,
      started_at: { $gte: since30d },
      is_bounce: false,
    }).sort({ session_quality_score: -1 }).limit(10).lean();

    const snapshots = await RankingRankSnapshot.find({
      'entries.entity_id': entityId,
    }).sort({ generated_at: -1 }).limit(5).lean();

    return { score, top_sessions: sessions, recent_snapshots: snapshots };
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────

  private static scoreTypeToField(scoreType: string): string {
    const map: Record<string, string> = {
      popularity: 'popularity_score',
      trending: 'trending_score',
      engagement: 'engagement_score',
      buyer_intent: 'buyer_intent_score',
      comparison_pressure: 'comparison_pressure_score',
      retention: 'retention_score',
    };
    return map[scoreType] ?? 'popularity_score';
  }
}

interface NormalizedSignals {
  attentionNorm: number;
  explorationNorm: number;
  evaluationNorm: number;
  commercialNorm: number;
  retentionNorm: number;
  comparisonNorm: number;
  qualityNorm: number;
}
