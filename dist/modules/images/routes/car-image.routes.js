"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const rate_limit_middleware_1 = require("../../../middlewares/rate-limit.middleware");
const upload_service_1 = require("../../../shared/services/upload.service");
const validation_1 = require("../../../shared/validation");
const car_image_controller_1 = require("../controllers/car-image.controller");
const router = (0, express_1.Router)();
// Public routes
router.get('/gallery', car_image_controller_1.CarImageController.getPublicGallery);
router.get('/gallery/car/:carId', car_image_controller_1.CarImageController.getCarGallery);
// Admin routes
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictTo)('admin', 'super_admin'));
adminRouter.get('/', validation_1.validatePaginationQuery, car_image_controller_1.CarImageController.getAllAdminCarImages);
adminRouter.get('/:id', validation_1.validateIdParam, car_image_controller_1.CarImageController.getAdminCarImageById);
const carImageUpload = upload_service_1.UploadService.createUploadMiddleware({
    fieldName: 'image',
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    useCloudinary: true,
    folder: 'car-images',
});
adminRouter.post('/', rate_limit_middleware_1.uploadRateLimiter, carImageUpload, car_image_controller_1.CarImageController.createCarImage);
adminRouter.put('/:id', validation_1.validateIdParam, carImageUpload, car_image_controller_1.CarImageController.updateCarImage);
adminRouter.delete('/:id', validation_1.validateIdParam, car_image_controller_1.CarImageController.deleteCarImage);
adminRouter.patch('/restore/:id', validation_1.validateIdParam, car_image_controller_1.CarImageController.restoreCarImage);
adminRouter.patch('/:id/publish', validation_1.validateIdParam, car_image_controller_1.CarImageController.togglePublish);
adminRouter.patch('/:id/primary', validation_1.validateIdParam, car_image_controller_1.CarImageController.setPrimaryImage);
router.use('/admin', adminRouter);
exports.default = router;
//# sourceMappingURL=car-image.routes.js.map