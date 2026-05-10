"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const validation_1 = require("../../../shared/validation");
const city_controller_1 = require("../controllers/city.controller");
const router = (0, express_1.Router)();
// Public routes
router.get('/public', validation_1.validatePaginationQuery, city_controller_1.CityController.getAllPublicCities);
router.get('/public/:slug', validation_1.validateSlugParam, city_controller_1.CityController.getPublicCityBySlug);
// Admin routes
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictTo)('admin', 'super_admin'));
adminRouter.get('/', validation_1.validatePaginationQuery, city_controller_1.CityController.getAllAdminCities);
adminRouter.get('/:id', validation_1.validateUuidIdParam, city_controller_1.CityController.getAdminCityById);
adminRouter.post('/', city_controller_1.CityController.createCity);
adminRouter.put('/:id', validation_1.validateUuidIdParam, city_controller_1.CityController.updateCity);
adminRouter.delete('/:id', validation_1.validateUuidIdParam, city_controller_1.CityController.deleteCity);
adminRouter.patch('/restore/:id', validation_1.validateUuidIdParam, city_controller_1.CityController.restoreCity);
router.use('/admin', adminRouter);
// Legacy routes for backward compatibility
router.get('/', validation_1.validatePaginationQuery, city_controller_1.CityController.getAllPublicCities);
router.get('/:slug', validation_1.validateSlugParam, city_controller_1.CityController.getPublicCityBySlug);
exports.default = router;
//# sourceMappingURL=city.routes.js.map