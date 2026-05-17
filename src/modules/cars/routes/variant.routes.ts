import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { validatePaginationQuery, validateSlugParam, validateUuidIdParam } from '../../../shared/validation';
import { CarVariantController } from '../controllers/car-variant.controller';

const router = Router();

// Public routes
router.get('/public', validatePaginationQuery, CarVariantController.getAllPublicVariants);
router.get('/public/:slug', validateSlugParam, CarVariantController.getPublicVariantBySlug);

// Admin routes
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictTo('admin', 'super_admin'));

adminRouter.get('/', validatePaginationQuery, CarVariantController.getAllAdminVariants);
adminRouter.get('/:id', validateUuidIdParam, CarVariantController.getAdminVariantById);
adminRouter.post('/', CarVariantController.createVariant);
adminRouter.put('/:id', validateUuidIdParam, CarVariantController.updateVariant);
adminRouter.delete('/:id', validateUuidIdParam, CarVariantController.deleteVariant);
adminRouter.patch('/restore/:id', validateUuidIdParam, CarVariantController.restoreVariant);
adminRouter.patch('/:id/publish', validateUuidIdParam, CarVariantController.togglePublish);
adminRouter.patch('/:id/publish/enable', validateUuidIdParam, CarVariantController.publishVariant);
adminRouter.patch('/:id/publish/disable', validateUuidIdParam, CarVariantController.unpublishVariant);
adminRouter.patch('/:id/archive', validateUuidIdParam, CarVariantController.archiveVariant);
adminRouter.patch('/:id/unarchive', validateUuidIdParam, CarVariantController.unarchiveVariant);
// Lifecycle & visibility routes
adminRouter.patch('/:id/visibility', validateUuidIdParam, CarVariantController.updateVisibility);
adminRouter.patch('/:id/lifecycle/unhide-on-launch', validateUuidIdParam, CarVariantController.unhideOnLaunch);
adminRouter.get('/:id/lifecycle/completeness', validateUuidIdParam, CarVariantController.getEstimationCompleteness);

// Difference engine & model aggregation routes
adminRouter.get('/:id/differences', validateUuidIdParam, CarVariantController.getVariantDifference);
adminRouter.get('/car/:carId/differences', CarVariantController.getCarVariantDifferences);
adminRouter.get('/car/:carId/aggregates', CarVariantController.getModelAggregates);

router.use('/admin', adminRouter);

// Legacy routes for backward compatibility
router.get('/', validatePaginationQuery, CarVariantController.getAllPublicVariants);
router.get('/:slug', validateSlugParam, CarVariantController.getPublicVariantBySlug);

export default router;
