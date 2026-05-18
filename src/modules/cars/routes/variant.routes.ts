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

// Validation routes
adminRouter.get('/:id/validate', validateUuidIdParam, CarVariantController.validateVariant);
adminRouter.get('/car/:carId/validate', CarVariantController.validateCarVariants);
adminRouter.post('/bulk/validate', CarVariantController.bulkValidate);

// Completeness routes
adminRouter.get('/:id/completeness', validateUuidIdParam, CarVariantController.getVariantCompleteness);
adminRouter.get('/car/:carId/completeness', CarVariantController.getCarCompleteness);

// Bulk operations routes
adminRouter.post('/bulk/update-status', CarVariantController.bulkUpdateStatus);
adminRouter.post('/bulk/publish', CarVariantController.bulkPublish);
adminRouter.post('/bulk/update-visibility', CarVariantController.bulkUpdateVisibility);
adminRouter.post('/bulk/update', CarVariantController.bulkUpdate);
adminRouter.post('/bulk/export-csv', CarVariantController.bulkExportCsv);

// Spec refinement routes
adminRouter.get('/:id/refine-specs', validateUuidIdParam, CarVariantController.refineVariantSpecs);
adminRouter.post('/:id/apply-refinement', validateUuidIdParam, CarVariantController.applyRefinementSuggestions);
adminRouter.post('/bulk/refine-specs', CarVariantController.refineMultipleVariants);

// Change history & integrity routes (Batch 6)
adminRouter.get('/:id/change-history', validateUuidIdParam, CarVariantController.getVariantChangeHistory);
adminRouter.get('/:id/audit-trail', validateUuidIdParam, CarVariantController.getVariantAuditTrail);
adminRouter.get('/:id/integrity-status', validateUuidIdParam, CarVariantController.getVariantIntegrityStatus);

// Enhanced validation routes (Batch 6)
adminRouter.get('/:id/validate/full', validateUuidIdParam, CarVariantController.validateVariantFull);
adminRouter.get('/:id/validate/automotive-constraints', validateUuidIdParam, CarVariantController.validateAutomotiveConstraints);

router.use('/admin', adminRouter);

// Legacy routes for backward compatibility
router.get('/', validatePaginationQuery, CarVariantController.getAllPublicVariants);
router.get('/:slug', validateSlugParam, CarVariantController.getPublicVariantBySlug);

export default router;
