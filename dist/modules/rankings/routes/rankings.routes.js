"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rankings_controller_1 = require("../controllers/rankings.controller");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// ── PUBLIC: EVENT INGESTION ───────────────────────────────────────────────
router.post('/events', rankings_controller_1.RankingsController.trackEvent);
router.post('/events/batch', rankings_controller_1.RankingsController.trackEventBatch);
// ── PUBLIC: RANKING QUERIES ───────────────────────────────────────────────
router.get('/popular', rankings_controller_1.RankingsController.getPopular);
router.get('/trending', rankings_controller_1.RankingsController.getTrending);
router.get('/engagement', rankings_controller_1.RankingsController.getEngagement);
router.get('/buyer-intent', rankings_controller_1.RankingsController.getBuyerIntent);
router.get('/comparison', rankings_controller_1.RankingsController.getComparison);
router.get('/retention', rankings_controller_1.RankingsController.getRetention);
// ── ADMIN ROUTES ──────────────────────────────────────────────────────────
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictToEditorOrAbove)());
adminRouter.get('/status', rankings_controller_1.RankingsController.getEngineStatus);
adminRouter.post('/recompute', rankings_controller_1.RankingsController.triggerRecompute);
adminRouter.post('/snapshot', rankings_controller_1.RankingsController.generateSnapshot);
adminRouter.get('/scores', rankings_controller_1.RankingsController.listScores);
adminRouter.get('/scores/:entity_id/inspect', rankings_controller_1.RankingsController.getScoreInspector);
adminRouter.get('/signals/:entity_id', rankings_controller_1.RankingsController.getSignalViewer);
adminRouter.get('/snapshots', rankings_controller_1.RankingsController.listSnapshots);
adminRouter.get('/snapshots/:snapshot_id', rankings_controller_1.RankingsController.getSnapshot);
adminRouter.get('/collections', rankings_controller_1.RankingsController.listCollectionConfigs);
adminRouter.get('/collections/:key', rankings_controller_1.RankingsController.getCollectionConfig);
adminRouter.put('/collections', rankings_controller_1.RankingsController.upsertCollectionConfig);
adminRouter.get('/sessions', rankings_controller_1.RankingsController.listSessions);
adminRouter.post('/sessions/:session_id/recompute', rankings_controller_1.RankingsController.recomputeSession);
router.use('/admin', adminRouter);
exports.default = router;
