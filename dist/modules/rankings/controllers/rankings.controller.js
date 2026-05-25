"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingsController = void 0;
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const event_ingestion_service_1 = require("../services/event-ingestion.service");
const session_quality_service_1 = require("../services/session-quality.service");
const ranking_engine_service_1 = require("../services/ranking-engine.service");
const ranking_session_model_1 = require("../../../models/ranking-session.model");
const ranking_raw_event_model_1 = require("../../../models/ranking-raw-event.model");
const ranking_score_model_1 = require("../../../models/ranking-score.model");
const ranking_rank_snapshot_model_1 = require("../../../models/ranking-rank-snapshot.model");
class RankingsController {
    // ── PUBLIC EVENT INGESTION ────────────────────────────────────────────────
    static trackEvent = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const event = await event_ingestion_service_1.EventIngestionService.ingest(req.body);
        return response_util_1.ResponseUtil.success(res, { event_id: event.event_id }, 'Event tracked');
    });
    static trackEventBatch = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { events } = req.body;
        if (!Array.isArray(events) || events.length === 0) {
            return response_util_1.ResponseUtil.error(res, 'events array is required', 400);
        }
        const result = await event_ingestion_service_1.EventIngestionService.ingestBatch(events.slice(0, 100));
        return response_util_1.ResponseUtil.success(res, result, 'Batch tracked');
    });
    // ── PUBLIC RANKING QUERIES ────────────────────────────────────────────────
    static getPopular = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const params = RankingsController.parseQueryParams(req);
        const results = await ranking_engine_service_1.RankingEngineService.getPopular(params);
        return response_util_1.ResponseUtil.success(res, results, 'Popular rankings');
    });
    static getTrending = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const params = RankingsController.parseQueryParams(req);
        const results = await ranking_engine_service_1.RankingEngineService.getTrending(params);
        return response_util_1.ResponseUtil.success(res, results, 'Trending rankings');
    });
    static getEngagement = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const params = RankingsController.parseQueryParams(req);
        const results = await ranking_engine_service_1.RankingEngineService.getByEngagement(params);
        return response_util_1.ResponseUtil.success(res, results, 'Engagement rankings');
    });
    static getBuyerIntent = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const params = RankingsController.parseQueryParams(req);
        const results = await ranking_engine_service_1.RankingEngineService.getByBuyerIntent(params);
        return response_util_1.ResponseUtil.success(res, results, 'Buyer intent rankings');
    });
    static getComparison = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const params = RankingsController.parseQueryParams(req);
        const results = await ranking_engine_service_1.RankingEngineService.getByComparison(params);
        return response_util_1.ResponseUtil.success(res, results, 'Comparison pressure rankings');
    });
    static getRetention = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const params = RankingsController.parseQueryParams(req);
        const results = await ranking_engine_service_1.RankingEngineService.getByRetention(params);
        return response_util_1.ResponseUtil.success(res, results, 'Retention rankings');
    });
    // ── ADMIN: ENGINE CONTROLS ────────────────────────────────────────────────
    static getEngineStatus = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const status = await ranking_engine_service_1.RankingEngineService.getEngineStatus();
        return response_util_1.ResponseUtil.success(res, status, 'Engine status');
    });
    static triggerRecompute = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const windowDays = parseInt(req.body.window_days ?? '30', 10);
        await ranking_engine_service_1.RankingEngineService.recomputeAllScores(windowDays);
        return response_util_1.ResponseUtil.success(res, { recomputed_at: new Date() }, 'Scores recomputed');
    });
    static generateSnapshot = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { score_type = 'popularity', entity_type = 'car', window_days = 30, limit = 50 } = req.body;
        await ranking_engine_service_1.RankingEngineService.generateSnapshot(score_type, entity_type, {}, window_days, limit);
        return response_util_1.ResponseUtil.success(res, { generated_at: new Date() }, 'Snapshot generated');
    });
    // ── ADMIN: SCORE INSPECTOR ────────────────────────────────────────────────
    static getScoreInspector = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const entity_id = req.params.entity_id;
        const data = await ranking_engine_service_1.RankingEngineService.getScoreInspector(entity_id);
        if (!data)
            return response_util_1.ResponseUtil.error(res, 'No score data for this entity', 404);
        return response_util_1.ResponseUtil.success(res, data, 'Score inspector data');
    });
    static listScores = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { entity_type = 'car', sort = 'popularity_score', limit = 50, offset = 0 } = req.query;
        const sortField = String(sort);
        const scores = await ranking_score_model_1.RankingScore.find({ entity_type: String(entity_type) })
            .sort({ [sortField]: -1 })
            .skip(Number(offset))
            .limit(Math.min(Number(limit), 200))
            .lean();
        const total = await ranking_score_model_1.RankingScore.countDocuments({ entity_type: String(entity_type) });
        return response_util_1.ResponseUtil.success(res, { scores, total }, 'Scores list');
    });
    // ── ADMIN: SIGNAL VIEWER ──────────────────────────────────────────────────
    static getSignalViewer = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const entity_id = req.params.entity_id;
        const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
        const sessions = await ranking_session_model_1.RankingSession.find({
            entity_ids: entity_id,
            started_at: { $gte: since },
        }).sort({ session_quality_score: -1 }).limit(20).lean();
        const eventTypes = await ranking_raw_event_model_1.RankingRawEvent.aggregate([
            { $match: { entity_id, timestamp: { $gte: since } } },
            { $group: { _id: '$event_type', count: { $sum: 1 }, avg_confidence: { $avg: '$event_confidence_score' } } },
            { $sort: { count: -1 } },
        ]);
        return response_util_1.ResponseUtil.success(res, { sessions, event_type_distribution: eventTypes }, 'Signal viewer');
    });
    // ── ADMIN: SNAPSHOT VIEWER ────────────────────────────────────────────────
    static listSnapshots = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { score_type, entity_type = 'car', limit = 10 } = req.query;
        const filter = { entity_type: String(entity_type) };
        if (score_type)
            filter.score_type = String(score_type);
        const snapshots = await ranking_rank_snapshot_model_1.RankingRankSnapshot.find(filter)
            .sort({ generated_at: -1 })
            .limit(Math.min(Number(limit), 50))
            .lean();
        return response_util_1.ResponseUtil.success(res, snapshots, 'Snapshots');
    });
    static getSnapshot = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const snapshot_id = req.params.snapshot_id;
        const snap = await ranking_rank_snapshot_model_1.RankingRankSnapshot.findOne({ snapshot_id }).lean();
        if (!snap)
            return response_util_1.ResponseUtil.error(res, 'Snapshot not found', 404);
        return response_util_1.ResponseUtil.success(res, snap, 'Snapshot');
    });
    // ── ADMIN: COLLECTION CONFIG ──────────────────────────────────────────────
    static listCollectionConfigs = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const configs = await ranking_engine_service_1.RankingEngineService.listCollectionConfigs();
        return response_util_1.ResponseUtil.success(res, configs, 'Collection configs');
    });
    static getCollectionConfig = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const key = req.params.key;
        const config = await ranking_engine_service_1.RankingEngineService.getCollectionConfig(key);
        if (!config)
            return response_util_1.ResponseUtil.error(res, 'Config not found', 404);
        return response_util_1.ResponseUtil.success(res, config, 'Collection config');
    });
    static upsertCollectionConfig = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const config = await ranking_engine_service_1.RankingEngineService.upsertCollectionConfig(req.body);
        return response_util_1.ResponseUtil.success(res, config, 'Config saved');
    });
    // ── ADMIN: SESSION QUALITY ────────────────────────────────────────────────
    static recomputeSession = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const session_id = req.params.session_id;
        await session_quality_service_1.SessionQualityService.recomputeAndSave(session_id);
        return response_util_1.ResponseUtil.success(res, { session_id }, 'Session recomputed');
    });
    static listSessions = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { entity_id, limit = 20, offset = 0, min_quality } = req.query;
        const filter = { is_bounce: false };
        if (entity_id)
            filter.entity_ids = String(entity_id);
        if (min_quality)
            filter.session_quality_score = { $gte: Number(min_quality) };
        const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
        filter.started_at = { $gte: since };
        const sessions = await ranking_session_model_1.RankingSession.find(filter)
            .sort({ session_quality_score: -1 })
            .skip(Number(offset))
            .limit(Math.min(Number(limit), 100))
            .lean();
        const total = await ranking_session_model_1.RankingSession.countDocuments(filter);
        return response_util_1.ResponseUtil.success(res, { sessions, total }, 'Sessions');
    });
    // ── HELPERS ───────────────────────────────────────────────────────────────
    static parseQueryParams(req) {
        const q = req.query;
        return {
            entity_type: q.entity_type ? String(q.entity_type) : 'car',
            brand_id: q.brand_id ? String(q.brand_id) : undefined,
            body_type_id: q.body_type_id ? String(q.body_type_id) : undefined,
            fuel_type_id: q.fuel_type_id ? String(q.fuel_type_id) : undefined,
            min_price: q.min_price ? Number(q.min_price) : undefined,
            max_price: q.max_price ? Number(q.max_price) : undefined,
            lifecycle_stage: q.lifecycle_stage ? String(q.lifecycle_stage) : undefined,
            city: q.city ? String(q.city) : undefined,
            seating: q.seating ? Number(q.seating) : undefined,
            limit: q.limit ? Math.min(Number(q.limit), 100) : 20,
            window_days: q.window_days ? Number(q.window_days) : 30,
        };
    }
}
exports.RankingsController = RankingsController;
//# sourceMappingURL=rankings.controller.js.map