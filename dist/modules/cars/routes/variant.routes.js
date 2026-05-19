"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const validation_1 = require("../../../shared/validation");
const car_variant_controller_1 = require("../controllers/car-variant.controller");
const router = (0, express_1.Router)();
// Public routes
router.get('/public', validation_1.validatePaginationQuery, car_variant_controller_1.CarVariantController.getAllPublicVariants);
router.get('/public/:slug', validation_1.validateSlugParam, car_variant_controller_1.CarVariantController.getPublicVariantBySlug);
// Admin routes
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictTo)('admin', 'super_admin'));
// GET / and POST / - List all and create (most general, placed first)
adminRouter.get('/', validation_1.validatePaginationQuery, car_variant_controller_1.CarVariantController.getAllAdminVariants);
adminRouter.post('/', car_variant_controller_1.CarVariantController.createVariant);
// Bulk operations - MUST come before /:id routes to avoid matching ':id' as parameter
adminRouter.post('/bulk/validate', car_variant_controller_1.CarVariantController.bulkValidate);
adminRouter.post('/bulk/update-status', car_variant_controller_1.CarVariantController.bulkUpdateStatus);
adminRouter.post('/bulk/publish', car_variant_controller_1.CarVariantController.bulkPublish);
adminRouter.post('/bulk/update-visibility', car_variant_controller_1.CarVariantController.bulkUpdateVisibility);
adminRouter.post('/bulk/update', car_variant_controller_1.CarVariantController.bulkUpdate);
adminRouter.post('/bulk/export-csv', car_variant_controller_1.CarVariantController.bulkExportCsv);
adminRouter.post('/bulk/refine-specs', car_variant_controller_1.CarVariantController.refineMultipleVariants);
// Car-scoped routes - MUST come before /:id routes
adminRouter.get('/car/:carId/differences', car_variant_controller_1.CarVariantController.getCarVariantDifferences);
adminRouter.get('/car/:carId/aggregates', car_variant_controller_1.CarVariantController.getModelAggregates);
adminRouter.get('/car/:carId/validate', car_variant_controller_1.CarVariantController.validateCarVariants);
adminRouter.get('/car/:carId/completeness', car_variant_controller_1.CarVariantController.getCarCompleteness);
// Restore route with specific path - MUST come before /:id routes
adminRouter.patch('/restore/:id', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.restoreVariant);
// Nested ID routes with specific sub-paths - MUST come before generic /:id routes
adminRouter.patch('/:id/publish', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.togglePublish);
adminRouter.patch('/:id/publish/enable', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.publishVariant);
adminRouter.patch('/:id/publish/disable', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.unpublishVariant);
adminRouter.patch('/:id/archive', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.archiveVariant);
adminRouter.patch('/:id/unarchive', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.unarchiveVariant);
adminRouter.patch('/:id/visibility', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.updateVisibility);
adminRouter.patch('/:id/lifecycle/unhide-on-launch', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.unhideOnLaunch);
adminRouter.get('/:id/lifecycle/completeness', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.getEstimationCompleteness);
adminRouter.get('/:id/differences', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.getVariantDifference);
adminRouter.get('/:id/validate', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.validateVariant);
adminRouter.get('/:id/completeness', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.getVariantCompleteness);
adminRouter.get('/:id/refine-specs', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.refineVariantSpecs);
adminRouter.post('/:id/apply-refinement', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.applyRefinementSuggestions);
adminRouter.get('/:id/change-history', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.getVariantChangeHistory);
adminRouter.get('/:id/audit-trail', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.getVariantAuditTrail);
adminRouter.get('/:id/integrity-status', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.getVariantIntegrityStatus);
adminRouter.get('/:id/validate/full', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.validateVariantFull);
adminRouter.get('/:id/validate/automotive-constraints', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.validateAutomotiveConstraints);
// Generic /:id routes - MUST come last after all specific routes
adminRouter.get('/:id', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.getAdminVariantById);
adminRouter.put('/:id', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.updateVariant);
adminRouter.delete('/:id', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.deleteVariant);
router.use('/admin', adminRouter);
// Legacy routes for backward compatibility
router.get('/', validation_1.validatePaginationQuery, car_variant_controller_1.CarVariantController.getAllPublicVariants);
router.get('/:slug', validation_1.validateSlugParam, car_variant_controller_1.CarVariantController.getPublicVariantBySlug);
exports.default = router;
//# sourceMappingURL=variant.routes.js.map