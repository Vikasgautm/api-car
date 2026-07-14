"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCarRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const upload_service_1 = require("../../../shared/services/upload.service");
const validation_1 = require("../../../shared/validation");
const car_controller_1 = require("../controllers/car.controller");
const validate_middleware_1 = require("../../../middlewares/validate.middleware");
const feature_flag_middleware_1 = require("../../../middlewares/feature-flag.middleware");
const sanitize_payload_middleware_1 = require("../../../middlewares/sanitize-payload.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get('/public', validation_1.validatePaginationQuery, car_controller_1.CarController.getAllPublicCars);
router.get('/public/:slug', validation_1.validateSlugParam, car_controller_1.CarController.getPublicCarBySlug);
// Admin routes
const adminRouter = (0, express_1.Router)();
exports.adminCarRouter = adminRouter;
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictTo)('admin', 'super_admin'));
adminRouter.get('/', validation_1.validatePaginationQuery, car_controller_1.CarController.getAllAdminCars);
adminRouter.post('/recompute-aggregates', (0, auth_middleware_1.restrictTo)('super_admin'), car_controller_1.CarController.recomputeAggregatesAll);
adminRouter.post('/:id/recompute-aggregates', validation_1.validateUuidIdParam, car_controller_1.CarController.recomputeAggregatesForCar);
adminRouter.post('/:id/refine-ai-flags', validation_1.validateUuidIdParam, (0, feature_flag_middleware_1.requireFeatureEnabled)('enable_ai_refinement'), car_controller_1.CarController.refineAiFlagsForCar);
adminRouter.get('/:id/dependencies', validation_1.validateUuidIdParam, car_controller_1.CarController.getCarDependencies);
adminRouter.get('/:id', validation_1.validateUuidIdParam, car_controller_1.CarController.getAdminCarById);
const thumbnailUpload = upload_service_1.UploadService.createUploadMiddleware({
    fieldName: 'thumbnail',
    maxFileSize: 2 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    useCloudinary: true,
    folder: 'cars',
});
adminRouter.post('/', sanitize_payload_middleware_1.stripBackendManagedCarFields, sanitize_payload_middleware_1.sanitizeHtmlFields, (0, validate_middleware_1.validateBody)(validation_1.createCarSchema), thumbnailUpload, car_controller_1.CarController.createCar);
adminRouter.put('/:id', validation_1.validateUuidIdParam, sanitize_payload_middleware_1.stripBackendManagedCarFields, sanitize_payload_middleware_1.sanitizeHtmlFields, (0, validate_middleware_1.validateBody)(validation_1.updateCarSchema), thumbnailUpload, car_controller_1.CarController.updateCar);
// Direct hard-delete is now reserved for super_admin. Day-to-day removals go
// through the OTP-gated deletion workflow (`POST /deletion-requests/admin`).
adminRouter.delete('/:id', validation_1.validateUuidIdParam, (0, auth_middleware_1.restrictTo)('super_admin'), car_controller_1.CarController.deleteCar);
adminRouter.patch('/restore/:id', validation_1.validateUuidIdParam, car_controller_1.CarController.restoreCar);
adminRouter.patch('/:id/publish', validation_1.validateUuidIdParam, car_controller_1.CarController.togglePublish);
adminRouter.patch('/:id/mark-launched', validation_1.validateUuidIdParam, car_controller_1.CarController.markLaunched);
adminRouter.patch('/:id/mark-upcoming', validation_1.validateUuidIdParam, car_controller_1.CarController.markUpcoming);
adminRouter.post('/:id/promote-to-current', validation_1.validateUuidIdParam, car_controller_1.CarController.promoteToCurrent);
// Lifecycle management routes
adminRouter.post('/:id/lifecycle/transition', validation_1.validateUuidIdParam, car_controller_1.CarController.transitionLifecycleState);
adminRouter.get('/:id/lifecycle/history', validation_1.validateUuidIdParam, car_controller_1.CarController.getLifecycleHistory);
adminRouter.post('/:id/lifecycle/schedule', validation_1.validateUuidIdParam, car_controller_1.CarController.scheduleStateChange);
adminRouter.get('/:id/seo/continuity', validation_1.validateUuidIdParam, car_controller_1.CarController.getSEOContinuityReport);
adminRouter.get('/lifecycle/upcoming-launches', car_controller_1.CarController.getUpcomingLaunches);
// Scheduled launch management
adminRouter.post('/lifecycle/process-scheduled', (0, auth_middleware_1.restrictTo)('super_admin'), car_controller_1.CarController.processScheduledLaunches);
adminRouter.get('/lifecycle/scheduled-window', car_controller_1.CarController.getScheduledLaunchesWindow);
adminRouter.post('/:id/lifecycle/cancel-scheduled', validation_1.validateUuidIdParam, car_controller_1.CarController.cancelScheduledLaunch);
// Change history & integrity routes (Batch 6)
adminRouter.get('/:id/change-history', validation_1.validateUuidIdParam, car_controller_1.CarController.getCarChangeHistory);
adminRouter.get('/:id/audit-trail', validation_1.validateUuidIdParam, car_controller_1.CarController.getCarAuditTrail);
adminRouter.get('/:id/change-summary', validation_1.validateUuidIdParam, car_controller_1.CarController.getCarChangeSummary);
router.use('/admin', adminRouter);
// Legacy routes for backward compatibility
router.get('/', validation_1.validatePaginationQuery, car_controller_1.CarController.getAllPublicCars);
router.get('/:slug', validation_1.validateSlugParam, car_controller_1.CarController.getPublicCarBySlug);
exports.default = router;
