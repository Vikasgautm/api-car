import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { validatePaginationQuery, validateSlugParam, validateUuidIdParam } from '../../../shared/validation';
import { BodyTypeController } from '../controllers/bodyType.controller';

const router = Router();

// Public routes
router.get('/public', validatePaginationQuery, BodyTypeController.getAllPublicBodyTypes);
router.get('/public/:slug', validateSlugParam, BodyTypeController.getPublicBodyTypeBySlug);

// Admin routes
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictTo('admin', 'super_admin'));

// Stats + utility endpoints (must come before /:id to avoid param conflicts)
adminRouter.get('/stats', BodyTypeController.getStats);
adminRouter.get('/check-duplicate', BodyTypeController.checkDuplicate);
adminRouter.post('/bulk', BodyTypeController.bulkOperation);
adminRouter.post('/reorder', BodyTypeController.reorderBodyTypes);

// Resource endpoints
adminRouter.get('/', validatePaginationQuery, BodyTypeController.getAllAdminBodyTypes);
adminRouter.get('/:id', validateUuidIdParam, BodyTypeController.getAdminBodyTypeById);
adminRouter.post('/', BodyTypeController.createBodyType);
adminRouter.put('/:id', validateUuidIdParam, BodyTypeController.updateBodyType);
adminRouter.delete('/:id', validateUuidIdParam, BodyTypeController.deleteBodyType);
adminRouter.patch('/restore/:id', validateUuidIdParam, BodyTypeController.restoreBodyType);
adminRouter.patch('/:id/publish', validateUuidIdParam, BodyTypeController.togglePublish);
adminRouter.get('/:id/impact', validateUuidIdParam, BodyTypeController.getArchiveImpact);

router.use('/admin', adminRouter);

// Legacy routes for backward compatibility
router.get('/', validatePaginationQuery, BodyTypeController.getAllPublicBodyTypes);
router.get('/:slug', validateSlugParam, BodyTypeController.getPublicBodyTypeBySlug);

export default router;
