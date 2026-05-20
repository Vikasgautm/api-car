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

// GET / and POST / - List all and create (most general, placed first)
adminRouter.get('/', validatePaginationQuery, CarVariantController.getAllAdminVariants);
adminRouter.post('/', CarVariantController.createVariant);

// Bulk operations - MUST come before /:id routes to avoid matching ':id' as parameter
adminRouter.post('/bulk/validate', CarVariantController.bulkValidate);
adminRouter.post('/bulk/update-status', CarVariantController.bulkUpdateStatus);
adminRouter.post('/bulk/publish', CarVariantController.bulkPublish);
adminRouter.post('/bulk/update-visibility', CarVariantController.bulkUpdateVisibility);
adminRouter.post('/bulk/update', CarVariantController.bulkUpdate);
adminRouter.post('/bulk/export-csv', CarVariantController.bulkExportCsv);
adminRouter.post('/bulk/refine-specs', CarVariantController.refineMultipleVariants);

// Car-scoped routes - MUST come before /:id routes
adminRouter.get('/car/:carId/differences', CarVariantController.getCarVariantDifferences);
adminRouter.get('/car/:carId/aggregates', CarVariantController.getModelAggregates);
adminRouter.get('/car/:carId/validate', CarVariantController.validateCarVariants);
adminRouter.get('/car/:carId/completeness', CarVariantController.getCarCompleteness);

// Restore route with specific path - MUST come before /:id routes
adminRouter.patch('/restore/:id', validateUuidIdParam, CarVariantController.restoreVariant);

// Nested ID routes with specific sub-paths - MUST come before generic /:id routes
adminRouter.patch('/:id/publish', validateUuidIdParam, CarVariantController.togglePublish);
adminRouter.patch('/:id/publish/enable', validateUuidIdParam, CarVariantController.publishVariant);
adminRouter.patch('/:id/publish/disable', validateUuidIdParam, CarVariantController.unpublishVariant);
adminRouter.patch('/:id/archive', validateUuidIdParam, CarVariantController.archiveVariant);
adminRouter.patch('/:id/unarchive', validateUuidIdParam, CarVariantController.unarchiveVariant);
adminRouter.patch('/:id/visibility', validateUuidIdParam, CarVariantController.updateVisibility);
adminRouter.patch('/:id/lifecycle/unhide-on-launch', validateUuidIdParam, CarVariantController.unhideOnLaunch);
adminRouter.get('/:id/lifecycle/completeness', validateUuidIdParam, CarVariantController.getEstimationCompleteness);
adminRouter.get('/:id/differences', validateUuidIdParam, CarVariantController.getVariantDifference);
adminRouter.get('/:id/validate', validateUuidIdParam, CarVariantController.validateVariant);
adminRouter.get('/:id/completeness', validateUuidIdParam, CarVariantController.getVariantCompleteness);
adminRouter.get('/:id/import-health', validateUuidIdParam, CarVariantController.getVariantImportHealth);
adminRouter.get('/:id/refine-specs', validateUuidIdParam, CarVariantController.refineVariantSpecs);
adminRouter.post('/:id/apply-refinement', validateUuidIdParam, CarVariantController.applyRefinementSuggestions);
adminRouter.get('/:id/change-history', validateUuidIdParam, CarVariantController.getVariantChangeHistory);
adminRouter.get('/:id/audit-trail', validateUuidIdParam, CarVariantController.getVariantAuditTrail);
adminRouter.get('/:id/integrity-status', validateUuidIdParam, CarVariantController.getVariantIntegrityStatus);
adminRouter.get('/:id/validate/full', validateUuidIdParam, CarVariantController.validateVariantFull);
adminRouter.get('/:id/validate/automotive-constraints', validateUuidIdParam, CarVariantController.validateAutomotiveConstraints);

// Generic /:id routes - MUST come last after all specific routes
adminRouter.get('/:id', validateUuidIdParam, CarVariantController.getAdminVariantById);
adminRouter.put('/:id', validateUuidIdParam, CarVariantController.updateVariant);
adminRouter.delete('/:id', validateUuidIdParam, CarVariantController.deleteVariant);

router.use('/admin', adminRouter);

// Legacy routes for backward compatibility
router.get('/', validatePaginationQuery, CarVariantController.getAllPublicVariants);
router.get('/:slug', validateSlugParam, CarVariantController.getPublicVariantBySlug);

export default router;
