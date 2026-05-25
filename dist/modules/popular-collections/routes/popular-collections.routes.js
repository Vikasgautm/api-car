"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const popular_collections_controller_1 = require("../controllers/popular-collections.controller");
const router = (0, express_1.Router)();
// ── PUBLIC: Hub + collection page rendering ───────────────────────────────
router.get('/hub', popular_collections_controller_1.PopularCollectionsController.getHub);
router.get('/render/:slug', popular_collections_controller_1.PopularCollectionsController.renderCollection);
// ── ADMIN ROUTES ──────────────────────────────────────────────────────────
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictToEditorOrAbove)());
// Status + recommendations
adminRouter.get('/status', popular_collections_controller_1.PopularCollectionsController.getSystemStatus);
adminRouter.get('/status/:id', popular_collections_controller_1.PopularCollectionsController.getCollectionStatus);
adminRouter.get('/recommendations', popular_collections_controller_1.PopularCollectionsController.getRecommendations);
// CRUD
adminRouter.get('/', popular_collections_controller_1.PopularCollectionsController.list);
adminRouter.post('/', popular_collections_controller_1.PopularCollectionsController.create);
adminRouter.get('/:id', popular_collections_controller_1.PopularCollectionsController.getById);
adminRouter.put('/:id', popular_collections_controller_1.PopularCollectionsController.update);
adminRouter.delete('/:id', popular_collections_controller_1.PopularCollectionsController.remove);
// Editorial operations
adminRouter.put('/:id/ordering', popular_collections_controller_1.PopularCollectionsController.updateOrdering);
adminRouter.put('/:id/rendering-mode', popular_collections_controller_1.PopularCollectionsController.updateRenderingMode);
adminRouter.post('/:id/publish', popular_collections_controller_1.PopularCollectionsController.publish);
adminRouter.post('/:id/archive', popular_collections_controller_1.PopularCollectionsController.archive);
adminRouter.post('/hub/reorder', popular_collections_controller_1.PopularCollectionsController.reorderHub);
// Preview
adminRouter.post('/preview-query', popular_collections_controller_1.PopularCollectionsController.previewQuery);
router.use('/admin', adminRouter);
exports.default = router;
//# sourceMappingURL=popular-collections.routes.js.map