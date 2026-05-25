import { Request, Response } from 'express';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { EventIngestionService } from '../services/event-ingestion.service';
import { SessionQualityService } from '../services/session-quality.service';
import { RankingEngineService } from '../services/ranking-engine.service';
import { RankingSession } from '../../../models/ranking-session.model';
import { RankingRawEvent } from '../../../models/ranking-raw-event.model';
import { RankingScore } from '../../../models/ranking-score.model';
import { RankingRankSnapshot } from '../../../models/ranking-rank-snapshot.model';

export class RankingsController {
  // ── PUBLIC EVENT INGESTION ────────────────────────────────────────────────

  static trackEvent = catchAsync(async (req: Request, res: Response) => {
    const event = await EventIngestionService.ingest(req.body);
    return ResponseUtil.success(res, { event_id: event.event_id }, 'Event tracked');
  });

  static trackEventBatch = catchAsync(async (req: Request, res: Response) => {
    const { events } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      return ResponseUtil.error(res, 'events array is required', 400);
    }
    const result = await EventIngestionService.ingestBatch(events.slice(0, 100));
    return ResponseUtil.success(res, result, 'Batch tracked');
  });

  // ── PUBLIC RANKING QUERIES ────────────────────────────────────────────────

  static getPopular = catchAsync(async (req: Request, res: Response) => {
    const params = RankingsController.parseQueryParams(req);
    const results = await RankingEngineService.getPopular(params);
    return ResponseUtil.success(res, results, 'Popular rankings');
  });

  static getTrending = catchAsync(async (req: Request, res: Response) => {
    const params = RankingsController.parseQueryParams(req);
    const results = await RankingEngineService.getTrending(params);
    return ResponseUtil.success(res, results, 'Trending rankings');
  });

  static getEngagement = catchAsync(async (req: Request, res: Response) => {
    const params = RankingsController.parseQueryParams(req);
    const results = await RankingEngineService.getByEngagement(params);
    return ResponseUtil.success(res, results, 'Engagement rankings');
  });

  static getBuyerIntent = catchAsync(async (req: Request, res: Response) => {
    const params = RankingsController.parseQueryParams(req);
    const results = await RankingEngineService.getByBuyerIntent(params);
    return ResponseUtil.success(res, results, 'Buyer intent rankings');
  });

  static getComparison = catchAsync(async (req: Request, res: Response) => {
    const params = RankingsController.parseQueryParams(req);
    const results = await RankingEngineService.getByComparison(params);
    return ResponseUtil.success(res, results, 'Comparison pressure rankings');
  });

  static getRetention = catchAsync(async (req: Request, res: Response) => {
    const params = RankingsController.parseQueryParams(req);
    const results = await RankingEngineService.getByRetention(params);
    return ResponseUtil.success(res, results, 'Retention rankings');
  });

  // ── ADMIN: ENGINE CONTROLS ────────────────────────────────────────────────

  static getEngineStatus = catchAsync(async (_req: Request, res: Response) => {
    const status = await RankingEngineService.getEngineStatus();
    return ResponseUtil.success(res, status, 'Engine status');
  });

  static triggerRecompute = catchAsync(async (req: Request, res: Response) => {
    const windowDays = parseInt(req.body.window_days ?? '30', 10);
    await RankingEngineService.recomputeAllScores(windowDays);
    return ResponseUtil.success(res, { recomputed_at: new Date() }, 'Scores recomputed');
  });

  static generateSnapshot = catchAsync(async (req: Request, res: Response) => {
    const { score_type = 'popularity', entity_type = 'car', window_days = 30, limit = 50 } = req.body;
    await RankingEngineService.generateSnapshot(score_type, entity_type, {}, window_days, limit);
    return ResponseUtil.success(res, { generated_at: new Date() }, 'Snapshot generated');
  });

  // ── ADMIN: SCORE INSPECTOR ────────────────────────────────────────────────

  static getScoreInspector = catchAsync(async (req: Request, res: Response) => {
    const entity_id = req.params.entity_id as string;
    const data = await RankingEngineService.getScoreInspector(entity_id);
    if (!data) return ResponseUtil.error(res, 'No score data for this entity', 404);
    return ResponseUtil.success(res, data, 'Score inspector data');
  });

  static listScores = catchAsync(async (req: Request, res: Response) => {
    const { entity_type = 'car', sort = 'popularity_score', limit = 50, offset = 0 } = req.query;
    const sortField = String(sort);
    const scores = await RankingScore.find({ entity_type: String(entity_type) })
      .sort({ [sortField]: -1 })
      .skip(Number(offset))
      .limit(Math.min(Number(limit), 200))
      .lean();
    const total = await RankingScore.countDocuments({ entity_type: String(entity_type) });
    return ResponseUtil.success(res, { scores, total }, 'Scores list');
  });

  // ── ADMIN: SIGNAL VIEWER ──────────────────────────────────────────────────

  static getSignalViewer = catchAsync(async (req: Request, res: Response) => {
    const entity_id = req.params.entity_id as string;
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const sessions = await RankingSession.find({
      entity_ids: entity_id,
      started_at: { $gte: since },
    }).sort({ session_quality_score: -1 }).limit(20).lean();

    const eventTypes = await RankingRawEvent.aggregate([
      { $match: { entity_id, timestamp: { $gte: since } } },
      { $group: { _id: '$event_type', count: { $sum: 1 }, avg_confidence: { $avg: '$event_confidence_score' } } },
      { $sort: { count: -1 } },
    ]);

    return ResponseUtil.success(res, { sessions, event_type_distribution: eventTypes }, 'Signal viewer');
  });

  // ── ADMIN: SNAPSHOT VIEWER ────────────────────────────────────────────────

  static listSnapshots = catchAsync(async (req: Request, res: Response) => {
    const { score_type, entity_type = 'car', limit = 10 } = req.query;
    const filter: Record<string, any> = { entity_type: String(entity_type) };
    if (score_type) filter.score_type = String(score_type);

    const snapshots = await RankingRankSnapshot.find(filter)
      .sort({ generated_at: -1 })
      .limit(Math.min(Number(limit), 50))
      .lean();

    return ResponseUtil.success(res, snapshots, 'Snapshots');
  });

  static getSnapshot = catchAsync(async (req: Request, res: Response) => {
    const snapshot_id = req.params.snapshot_id as string;
    const snap = await RankingRankSnapshot.findOne({ snapshot_id }).lean();
    if (!snap) return ResponseUtil.error(res, 'Snapshot not found', 404);
    return ResponseUtil.success(res, snap, 'Snapshot');
  });

  // ── ADMIN: COLLECTION CONFIG ──────────────────────────────────────────────

  static listCollectionConfigs = catchAsync(async (_req: Request, res: Response) => {
    const configs = await RankingEngineService.listCollectionConfigs();
    return ResponseUtil.success(res, configs, 'Collection configs');
  });

  static getCollectionConfig = catchAsync(async (req: Request, res: Response) => {
    const key = req.params.key as string;
    const config = await RankingEngineService.getCollectionConfig(key);
    if (!config) return ResponseUtil.error(res, 'Config not found', 404);
    return ResponseUtil.success(res, config, 'Collection config');
  });

  static upsertCollectionConfig = catchAsync(async (req: Request, res: Response) => {
    const config = await RankingEngineService.upsertCollectionConfig(req.body);
    return ResponseUtil.success(res, config, 'Config saved');
  });

  // ── ADMIN: SESSION QUALITY ────────────────────────────────────────────────

  static recomputeSession = catchAsync(async (req: Request, res: Response) => {
    const session_id = req.params.session_id as string;
    await SessionQualityService.recomputeAndSave(session_id);
    return ResponseUtil.success(res, { session_id }, 'Session recomputed');
  });

  static listSessions = catchAsync(async (req: Request, res: Response) => {
    const { entity_id, limit = 20, offset = 0, min_quality } = req.query;
    const filter: Record<string, any> = { is_bounce: false };
    if (entity_id) filter.entity_ids = String(entity_id);
    if (min_quality) filter.session_quality_score = { $gte: Number(min_quality) };

    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    filter.started_at = { $gte: since };

    const sessions = await RankingSession.find(filter)
      .sort({ session_quality_score: -1 })
      .skip(Number(offset))
      .limit(Math.min(Number(limit), 100))
      .lean();

    const total = await RankingSession.countDocuments(filter);
    return ResponseUtil.success(res, { sessions, total }, 'Sessions');
  });

  // ── HELPERS ───────────────────────────────────────────────────────────────

  private static parseQueryParams(req: Request) {
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
