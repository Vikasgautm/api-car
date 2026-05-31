import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { UploadService } from '../../../shared/services/upload.service';
import { createCarSchema, updateCarSchema, validatePaginationQuery, validateSlugParam, validateUuidIdParam } from '../../../shared/validation';
import { CarController } from '../controllers/car.controller';
import { validateBody } from '../../../middlewares/validate.middleware';
import { requireFeatureEnabled } from '../../../middlewares/feature-flag.middleware';
import { stripBackendManagedCarFields, sanitizeHtmlFields } from '../../../middlewares/sanitize-payload.middleware';

const router = Router();

// Public routes
router.get('/public', validatePaginationQuery, CarController.getAllPublicCars);
router.get('/public/:slug', validateSlugParam, CarController.getPublicCarBySlug);

// Admin routes
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictTo('admin', 'super_admin'));

adminRouter.get('/', validatePaginationQuery, CarController.getAllAdminCars);
adminRouter.post('/recompute-aggregates', restrictTo('super_admin'), CarController.recomputeAggregatesAll);
adminRouter.post('/:id/recompute-aggregates', validateUuidIdParam, CarController.recomputeAggregatesForCar);
adminRouter.post('/:id/refine-ai-flags', validateUuidIdParam, requireFeatureEnabled('enable_ai_refinement'), CarController.refineAiFlagsForCar);
adminRouter.get('/:id/dependencies', validateUuidIdParam, CarController.getCarDependencies);
adminRouter.get('/:id', validateUuidIdParam, CarController.getAdminCarById);

const thumbnailUpload = UploadService.createUploadMiddleware({
  fieldName: 'thumbnail',
  maxFileSize: 2 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  useCloudinary: true,
  folder: 'cars',
});

adminRouter.post('/', stripBackendManagedCarFields, sanitizeHtmlFields, validateBody(createCarSchema), thumbnailUpload, CarController.createCar);
adminRouter.put('/:id', validateUuidIdParam, stripBackendManagedCarFields, sanitizeHtmlFields, validateBody(updateCarSchema), thumbnailUpload, CarController.updateCar);
// Direct hard-delete is now reserved for super_admin. Day-to-day removals go
// through the OTP-gated deletion workflow (`POST /deletion-requests/admin`).
adminRouter.delete('/:id', validateUuidIdParam, restrictTo('super_admin'), CarController.deleteCar);
adminRouter.patch('/restore/:id', validateUuidIdParam, CarController.restoreCar);
adminRouter.patch('/:id/publish', validateUuidIdParam, CarController.togglePublish);
adminRouter.patch('/:id/mark-launched', validateUuidIdParam, CarController.markLaunched);
adminRouter.patch('/:id/mark-upcoming', validateUuidIdParam, CarController.markUpcoming);
adminRouter.post('/:id/promote-to-current', validateUuidIdParam, CarController.promoteToCurrent);
// Lifecycle management routes
adminRouter.post('/:id/lifecycle/transition', validateUuidIdParam, CarController.transitionLifecycleState);
adminRouter.get('/:id/lifecycle/history', validateUuidIdParam, CarController.getLifecycleHistory);
adminRouter.post('/:id/lifecycle/schedule', validateUuidIdParam, CarController.scheduleStateChange);
adminRouter.get('/:id/seo/continuity', validateUuidIdParam, CarController.getSEOContinuityReport);
adminRouter.get('/lifecycle/upcoming-launches', CarController.getUpcomingLaunches);
// Scheduled launch management
adminRouter.post('/lifecycle/process-scheduled', restrictTo('super_admin'), CarController.processScheduledLaunches);
adminRouter.get('/lifecycle/scheduled-window', CarController.getScheduledLaunchesWindow);
adminRouter.post('/:id/lifecycle/cancel-scheduled', validateUuidIdParam, CarController.cancelScheduledLaunch);

// Change history & integrity routes (Batch 6)
adminRouter.get('/:id/change-history', validateUuidIdParam, CarController.getCarChangeHistory);
adminRouter.get('/:id/audit-trail', validateUuidIdParam, CarController.getCarAuditTrail);
adminRouter.get('/:id/change-summary', validateUuidIdParam, CarController.getCarChangeSummary);

router.use('/admin', adminRouter);

// Legacy routes for backward compatibility
router.get('/', validatePaginationQuery, CarController.getAllPublicCars);
router.get('/:slug', validateSlugParam, CarController.getPublicCarBySlug);

// Export admin router separately for alternate /admin/cars mount
export { adminRouter as adminCarRouter };
export default router;
