import { Router } from 'express';
import { RankingsController } from '../controllers/rankings.controller';
import { protect, restrictToEditorOrAbove } from '../../../middlewares/auth.middleware';

const router = Router();

// ── PUBLIC: EVENT INGESTION ───────────────────────────────────────────────
router.post('/events', RankingsController.trackEvent);
router.post('/events/batch', RankingsController.trackEventBatch);

// ── PUBLIC: RANKING QUERIES ───────────────────────────────────────────────
router.get('/popular', RankingsController.getPopular);
router.get('/trending', RankingsController.getTrending);
router.get('/engagement', RankingsController.getEngagement);
router.get('/buyer-intent', RankingsController.getBuyerIntent);
router.get('/comparison', RankingsController.getComparison);
router.get('/retention', RankingsController.getRetention);

// ── ADMIN ROUTES ──────────────────────────────────────────────────────────
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictToEditorOrAbove());

adminRouter.get('/status', RankingsController.getEngineStatus);
adminRouter.post('/recompute', RankingsController.triggerRecompute);
adminRouter.post('/snapshot', RankingsController.generateSnapshot);

adminRouter.get('/scores', RankingsController.listScores);
adminRouter.get('/scores/:entity_id/inspect', RankingsController.getScoreInspector);

adminRouter.get('/signals/:entity_id', RankingsController.getSignalViewer);

adminRouter.get('/snapshots', RankingsController.listSnapshots);
adminRouter.get('/snapshots/:snapshot_id', RankingsController.getSnapshot);

adminRouter.get('/collections', RankingsController.listCollectionConfigs);
adminRouter.get('/collections/:key', RankingsController.getCollectionConfig);
adminRouter.put('/collections', RankingsController.upsertCollectionConfig);

adminRouter.get('/sessions', RankingsController.listSessions);
adminRouter.post('/sessions/:session_id/recompute', RankingsController.recomputeSession);

router.use('/admin', adminRouter);

export default router;
