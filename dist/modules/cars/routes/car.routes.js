"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const upload_service_1 = require("../../../shared/services/upload.service");
const validation_1 = require("../../../shared/validation");
const car_controller_1 = require("../controllers/car.controller");
const router = (0, express_1.Router)();
// Public routes
router.get('/public', validation_1.validatePaginationQuery, car_controller_1.CarController.getAllPublicCars);
router.get('/public/:slug', validation_1.validateSlugParam, car_controller_1.CarController.getPublicCarBySlug);
// Admin routes
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictTo)('admin', 'super_admin'));
adminRouter.get('/', validation_1.validatePaginationQuery, car_controller_1.CarController.getAllAdminCars);
adminRouter.get('/:id', validation_1.validateUuidIdParam, car_controller_1.CarController.getAdminCarById);
const thumbnailUpload = upload_service_1.UploadService.createUploadMiddleware({
    fieldName: 'thumbnail',
    maxFileSize: 2 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    useCloudinary: true,
    folder: 'cars',
});
adminRouter.post('/', thumbnailUpload, car_controller_1.CarController.createCar);
adminRouter.put('/:id', validation_1.validateUuidIdParam, thumbnailUpload, car_controller_1.CarController.updateCar);
adminRouter.delete('/:id', validation_1.validateUuidIdParam, car_controller_1.CarController.deleteCar);
adminRouter.patch('/restore/:id', validation_1.validateUuidIdParam, car_controller_1.CarController.restoreCar);
adminRouter.patch('/:id/publish', validation_1.validateUuidIdParam, car_controller_1.CarController.togglePublish);
adminRouter.patch('/:id/mark-launched', validation_1.validateUuidIdParam, car_controller_1.CarController.markLaunched);
adminRouter.patch('/:id/mark-upcoming', validation_1.validateUuidIdParam, car_controller_1.CarController.markUpcoming);
router.use('/admin', adminRouter);
// Legacy routes for backward compatibility
router.get('/', validation_1.validatePaginationQuery, car_controller_1.CarController.getAllPublicCars);
router.get('/:slug', validation_1.validateSlugParam, car_controller_1.CarController.getPublicCarBySlug);
exports.default = router;
//# sourceMappingURL=car.routes.js.map