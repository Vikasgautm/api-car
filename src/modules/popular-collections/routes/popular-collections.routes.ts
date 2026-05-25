import { Router } from 'express';
import { protect, restrictToEditorOrAbove } from '../../../middlewares/auth.middleware';
import { PopularCollectionsController } from '../controllers/popular-collections.controller';

const router = Router();

// ── PUBLIC: Hub + collection page rendering ───────────────────────────────
router.get('/hub', PopularCollectionsController.getHub);
router.get('/render/:slug', PopularCollectionsController.renderCollection);

// ── ADMIN ROUTES ──────────────────────────────────────────────────────────
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictToEditorOrAbove());

// Status + recommendations
adminRouter.get('/status', PopularCollectionsController.getSystemStatus);
adminRouter.get('/status/:id', PopularCollectionsController.getCollectionStatus);
adminRouter.get('/recommendations', PopularCollectionsController.getRecommendations);

// CRUD
adminRouter.get('/', PopularCollectionsController.list);
adminRouter.post('/', PopularCollectionsController.create);
adminRouter.get('/:id', PopularCollectionsController.getById);
adminRouter.put('/:id', PopularCollectionsController.update);
adminRouter.delete('/:id', PopularCollectionsController.remove);

// Editorial operations
adminRouter.put('/:id/ordering', PopularCollectionsController.updateOrdering);
adminRouter.put('/:id/rendering-mode', PopularCollectionsController.updateRenderingMode);
adminRouter.post('/:id/publish', PopularCollectionsController.publish);
adminRouter.post('/:id/archive', PopularCollectionsController.archive);
adminRouter.post('/hub/reorder', PopularCollectionsController.reorderHub);

// Preview
adminRouter.post('/preview-query', PopularCollectionsController.previewQuery);

router.use('/admin', adminRouter);

export default router;
