"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingEngineService = void 0;
const uuid_1 = require("uuid");
const ranking_session_model_1 = require("../../../models/ranking-session.model");
const ranking_score_model_1 = require("../../../models/ranking-score.model");
const ranking_rank_snapshot_model_1 = require("../../../models/ranking-rank-snapshot.model");
const ranking_collection_config_model_1 = require("../../../models/ranking-collection-config.model");
const DECAY_HALF_LIFE_DAYS = 14; // scores halve every 14 days without new activity
class RankingEngineService {
    // ── SCORE RECOMPUTATION ───────────────────────────────────────────────────
    static async recomputeAllScores(windowDays = 30) {
        const since = new Date(Date.now() - windowDays * 24 * 3600 * 1000);
        // Close stale active sessions first
        const staleThreshold = new Date(Date.now() - 30 * 60 * 1000);
        await ranking_session_model_1.RankingSession.updateMany({ is_active: true, last_event_at: { $lt: staleThreshold } }, { $set: { is_active: false, ended_at: staleThreshold } });
        // Fetch all closed sessions in window
        const sessions = await ranking_session_model_1.RankingSession.find({
            started_at: { $gte: since },
            is_active: false,
            is_bounce: false,
            session_quality_score: { $gt: 0 },
        }).lean();
        // Group sessions by entity_id
        const entitySessions = new Map();
        for (const session of sessions) {
            for (const entityId of session.entity_ids) {
                if (!entitySessions.has(entityId)) {
                    entitySessions.set(entityId, { entity_type: 'car', sessions: [] });
                }
                entitySessions.get(entityId).sessions.push(session);
            }
        }
        // For each entity, compute aggregated signals
        const rawSignalsByEntity = new Map();
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
        if (rawSignalsByEntity.size === 0)
            return;
        // Percentile normalization
        const normalizedSignals = this.percentileNormalize(rawSignalsByEntity);
        // Compute previous scores for trend
        const prevScores = await ranking_score_model_1.RankingScore.find({
            entity_type: 'car',
        }).lean();
        const prevMap = new Map(prevScores.map(s => [s.entity_id, s]));
        // Upsert scores
        for (const [entityId, norm] of normalizedSignals) {
            const data = rawSignalsByEntity.get(entityId);
            const prev = prevMap.get(entityId);
            const popularity_score = this.computePopularityScore(norm);
            const trending_score = this.computeTrendingScore(norm);
            const engagement_score = this.computeEngagementScore(norm);
            const buyer_intent_score = this.computeBuyerIntentScore(norm);
            const comparison_pressure_score = this.computeComparisonPressureScore(norm);
            const retention_score = this.computeRetentionScore(norm);
            const trending_velocity = prev ? popularity_score - prev.popularity_score : 0;
            const trending_direction = trending_velocity > 5 ? 'rising' : trending_velocity < -5 ? 'falling' : 'stable';
            // Behavioral confidence = session count + quality factor
            const behavioral_confidence = Math.min(100, (Math.log(data.sessionCount + 1) / Math.log(101)) * 60 + // up to 60 from session volume
                (norm.qualityNorm) * 40 // up to 40 from quality
            );
            await ranking_score_model_1.RankingScore.findOneAndUpdate({ entity_type: data.entity_type, entity_id: entityId }, {
                $set: {
                    score_id: (0, uuid_1.v4)(),
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
            }, { upsert: true, returnDocument: 'after' });
        }
    }
    // ── SCORE FORMULAS ────────────────────────────────────────────────────────
    static computePopularityScore(norm) {
        return Math.min(100, norm.attentionNorm * 35 +
            norm.evaluationNorm * 30 +
            norm.retentionNorm * 20 +
            norm.commercialNorm * 15);
    }
    static computeTrendingScore(norm) {
        // For trending, we weight acceleration — use raw norm as proxy for now
        // Phase 2 will add proper window-over-window acceleration
        return Math.min(100, norm.attentionNorm * 40 +
            norm.evaluationNorm * 30 +
            norm.qualityNorm * 20 +
            norm.commercialNorm * 10);
    }
    static computeEngagementScore(norm) {
        return Math.min(100, norm.explorationNorm * 40 +
            norm.attentionNorm * 30 +
            norm.evaluationNorm * 20 +
            norm.retentionNorm * 10);
    }
    static computeBuyerIntentScore(norm) {
        return Math.min(100, norm.commercialNorm * 50 +
            norm.evaluationNorm * 25 +
            norm.retentionNorm * 15 +
            norm.attentionNorm * 10);
    }
    static computeComparisonPressureScore(norm) {
        return Math.min(100, norm.comparisonNorm * 60 +
            norm.evaluationNorm * 25 +
            norm.qualityNorm * 15);
    }
    static computeRetentionScore(norm) {
        return Math.min(100, norm.retentionNorm * 50 +
            norm.qualityNorm * 30 +
            norm.attentionNorm * 20);
    }
    // ── DECAY ─────────────────────────────────────────────────────────────────
    static computeDecayFactor(sessionDate, windowDays) {
        const ageMs = Date.now() - sessionDate.getTime();
        const ageDays = ageMs / (24 * 3600 * 1000);
        // Exponential decay: f(t) = e^(-λt), λ = ln(2)/half_life
        const lambda = Math.LN2 / DECAY_HALF_LIFE_DAYS;
        return Math.exp(-lambda * ageDays);
    }
    // ── PERCENTILE NORMALIZATION ───────────────────────────────────────────────
    static percentileNormalize(entityMap) {
        const entities = Array.from(entityMap.entries());
        const rank = (values, val) => {
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
        const result = new Map();
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
    static async generateSnapshot(scoreType, entityType = 'car', filterContext = {}, windowDays = 30, limit = 50) {
        const scoreField = this.scoreTypeToField(scoreType);
        const query = { entity_type: entityType };
        const scores = await ranking_score_model_1.RankingScore.find(query)
            .sort({ [scoreField]: -1 })
            .limit(limit)
            .lean();
        if (scores.length === 0)
            return;
        const avgConfidence = scores.reduce((s, r) => s + r.behavioral_confidence, 0) / scores.length;
        await ranking_rank_snapshot_model_1.RankingRankSnapshot.create({
            snapshot_id: (0, uuid_1.v4)(),
            score_type: scoreType,
            entity_type: entityType,
            filter_context: filterContext,
            entries: scores.map((s, idx) => ({
                entity_id: s.entity_id,
                entity_type: s.entity_type,
                rank: idx + 1,
                score: s[scoreField],
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
    static async getPopular(params) {
        return this.queryScores('popularity_score', params);
    }
    static async getTrending(params) {
        return this.queryScores('trending_score', params);
    }
    static async getByEngagement(params) {
        return this.queryScores('engagement_score', params);
    }
    static async getByBuyerIntent(params) {
        return this.queryScores('buyer_intent_score', params);
    }
    static async getByComparison(params) {
        return this.queryScores('comparison_pressure_score', params);
    }
    static async getByRetention(params) {
        return this.queryScores('retention_score', params);
    }
    static async queryScores(sortField, params) {
        const query = {
            entity_type: params.entity_type ?? 'car',
        };
        const limit = Math.min(params.limit ?? 20, 100);
        const scores = await ranking_score_model_1.RankingScore.find(query)
            .sort({ [sortField]: -1 })
            .limit(limit)
            .lean();
        return scores.map((s, idx) => ({
            entity_id: s.entity_id,
            entity_type: s.entity_type,
            score: s[sortField],
            rank: idx + 1,
            behavioral_confidence: s.behavioral_confidence,
            trending_direction: s.trending_direction,
            trending_velocity: s.trending_velocity,
        }));
    }
    // ── COLLECTION RENDERING ──────────────────────────────────────────────────
    static async getCollectionRanking(collectionKey, candidateEntityIds, entityType = 'car') {
        const config = await ranking_collection_config_model_1.RankingCollectionConfig.findOne({ collection_key: collectionKey, is_active: true }).lean();
        const mode = config?.rendering_mode ?? 'manual';
        if (mode === 'manual' || mode === 'observe_only') {
            return { entity_ids: candidateEntityIds, rendering_mode: mode, behavioral_confidence: 0 };
        }
        const scores = await ranking_score_model_1.RankingScore.find({
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
        const scoreMap = new Map(scores.map(s => [s.entity_id, s[scoreField]]));
        // Apply suppressions and pins
        const suppressed = new Set(config?.suppressed_entity_ids ?? []);
        const pinned = config?.pinned_entity_ids ?? [];
        const boostMap = new Map((config?.editorial_boosts ?? [])
            .filter(b => !b.expires_at || new Date(b.expires_at) > new Date())
            .map(b => [b.entity_id, b.boost_score]));
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
    static async getEngineStatus() {
        const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000);
        const [totalScored, sessionCount, configs] = await Promise.all([
            ranking_score_model_1.RankingScore.countDocuments({}),
            ranking_session_model_1.RankingSession.countDocuments({ started_at: { $gte: since30d }, is_bounce: false }),
            ranking_collection_config_model_1.RankingCollectionConfig.find({ is_active: true }).lean(),
        ]);
        const scores = await ranking_score_model_1.RankingScore.find({}).select('behavioral_confidence trending_direction entity_id').lean();
        const avgConfidence = scores.length > 0
            ? scores.reduce((s, r) => s + r.behavioral_confidence, 0) / scores.length
            : 0;
        const highConfidenceCount = scores.filter(s => s.behavioral_confidence >= 70).length;
        const rising = scores.filter(s => s.trending_direction === 'rising').map(s => s.entity_id).slice(0, 10);
        const lastScore = await ranking_score_model_1.RankingScore.findOne({}).sort({ computed_at: -1 }).select('computed_at').lean();
        const modeDistribution = {};
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
        return ranking_collection_config_model_1.RankingCollectionConfig.find({}).sort({ collection_label: 1 }).lean();
    }
    static async getCollectionConfig(collectionKey) {
        return ranking_collection_config_model_1.RankingCollectionConfig.findOne({ collection_key: collectionKey }).lean();
    }
    static async upsertCollectionConfig(data) {
        return ranking_collection_config_model_1.RankingCollectionConfig.findOneAndUpdate({ collection_key: data.collection_key }, {
            $set: {
                config_id: data.config_id ?? (0, uuid_1.v4)(),
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
        }, { upsert: true, returnDocument: 'after' });
    }
    static async getScoreInspector(entityId) {
        const score = await ranking_score_model_1.RankingScore.findOne({ entity_id: entityId }).lean();
        if (!score)
            return null;
        const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000);
        const sessions = await ranking_session_model_1.RankingSession.find({
            entity_ids: entityId,
            started_at: { $gte: since30d },
            is_bounce: false,
        }).sort({ session_quality_score: -1 }).limit(10).lean();
        const snapshots = await ranking_rank_snapshot_model_1.RankingRankSnapshot.find({
            'entries.entity_id': entityId,
        }).sort({ generated_at: -1 }).limit(5).lean();
        return { score, top_sessions: sessions, recent_snapshots: snapshots };
    }
    // ── HELPERS ───────────────────────────────────────────────────────────────
    static scoreTypeToField(scoreType) {
        const map = {
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
exports.RankingEngineService = RankingEngineService;
//# sourceMappingURL=ranking-engine.service.js.map