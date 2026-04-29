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
adminRouter.get('/', validation_1.validatePaginationQuery, car_variant_controller_1.CarVariantController.getAllAdminVariants);
adminRouter.get('/:id', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.getAdminVariantById);
adminRouter.post('/', car_variant_controller_1.CarVariantController.createVariant);
adminRouter.put('/:id', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.updateVariant);
adminRouter.delete('/:id', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.deleteVariant);
adminRouter.patch('/restore/:id', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.restoreVariant);
adminRouter.patch('/:id/publish', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.togglePublish);
adminRouter.patch('/:id/publish/enable', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.publishVariant);
adminRouter.patch('/:id/publish/disable', validation_1.validateUuidIdParam, car_variant_controller_1.CarVariantController.unpublishVariant);
router.use('/admin', adminRouter);
// Legacy routes for backward compatibility
router.get('/', validation_1.validatePaginationQuery, car_variant_controller_1.CarVariantController.getAllPublicVariants);
router.get('/:slug', validation_1.validateSlugParam, car_variant_controller_1.CarVariantController.getPublicVariantBySlug);
exports.default = router;
//# sourceMappingURL=variant.routes.js.map