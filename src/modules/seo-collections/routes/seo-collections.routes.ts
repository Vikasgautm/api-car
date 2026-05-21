import { Router } from 'express';
import { protect, restrictToEditorOrAbove } from '../../../middlewares/auth.middleware';
import { validateSlugParam, validateUuidIdParam } from '../../../shared/validation';
import { SeoCollectionsController } from '../controllers/seo-collections.controller';

const router = Router();

// Public: hydrate a published collection with live discovery results
router.get('/public/:slug', validateSlugParam, SeoCollectionsController.getPublicBySlug);

// Admin routes
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictToEditorOrAbove());

adminRouter.get('/health/summary', SeoCollectionsController.healthSummary);
adminRouter.get('/health', SeoCollectionsController.health);
adminRouter.get('/', SeoCollectionsController.list);
adminRouter.get('/:id', validateUuidIdParam, SeoCollectionsController.getById);
adminRouter.post('/preview-query', SeoCollectionsController.previewQuery);
adminRouter.post('/', SeoCollectionsController.create);
adminRouter.put('/:id', validateUuidIdParam, SeoCollectionsController.update);
adminRouter.delete('/:id', validateUuidIdParam, SeoCollectionsController.remove);
adminRouter.post('/:id/refresh', validateUuidIdParam, SeoCollectionsController.refresh);
adminRouter.post('/:id/generate-content', validateUuidIdParam, SeoCollectionsController.generateContent);

router.use('/admin', adminRouter);

export default router;
