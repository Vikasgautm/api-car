"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const validation_1 = require("../../../shared/validation");
const fuel_type_controller_1 = require("../controllers/fuel-type.controller");
const router = (0, express_1.Router)();
// Public routes
router.get('/public', validation_1.validatePaginationQuery, fuel_type_controller_1.FuelTypeController.getAllPublicFuelTypes);
router.get('/public/:slug', validation_1.validateSlugParam, fuel_type_controller_1.FuelTypeController.getPublicFuelTypeBySlug);
// Admin routes
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictTo)('admin', 'super_admin'));
adminRouter.get('/', validation_1.validatePaginationQuery, fuel_type_controller_1.FuelTypeController.getAllAdminFuelTypes);
adminRouter.get('/:id', validation_1.validateIdParam, fuel_type_controller_1.FuelTypeController.getAdminFuelTypeById);
adminRouter.post('/', fuel_type_controller_1.FuelTypeController.createFuelType);
adminRouter.put('/:id', validation_1.validateIdParam, fuel_type_controller_1.FuelTypeController.updateFuelType);
adminRouter.delete('/:id', validation_1.validateIdParam, fuel_type_controller_1.FuelTypeController.deleteFuelType);
adminRouter.patch('/restore/:id', validation_1.validateIdParam, fuel_type_controller_1.FuelTypeController.restoreFuelType);
adminRouter.patch('/:id/publish', validation_1.validateIdParam, fuel_type_controller_1.FuelTypeController.togglePublish);
router.use('/admin', adminRouter);
// Legacy routes for backward compatibility
router.get('/', validation_1.validatePaginationQuery, fuel_type_controller_1.FuelTypeController.getAllPublicFuelTypes);
router.get('/:slug', validation_1.validateSlugParam, fuel_type_controller_1.FuelTypeController.getPublicFuelTypeBySlug);
exports.default = router;
//# sourceMappingURL=fuel-type.routes.js.map