"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const rate_limit_middleware_1 = require("../../../middlewares/rate-limit.middleware");
const upload_service_1 = require("../../../shared/services/upload.service");
const validation_1 = require("../../../shared/validation");
const car_image_controller_1 = require("../controllers/car-image.controller");
const router = (0, express_1.Router)();
// ─── Allowed MIME types (avif, webp, png, jpeg — no gif/bmp/tiff/heic/svg) ───
const AUTOMOTIVE_MIME_TYPES = [
    'image/avif',
    'image/webp',
    'image/png',
    'image/jpeg',
];
const carImageUpload = upload_service_1.UploadService.createUploadMiddleware({
    fieldName: 'image',
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: AUTOMOTIVE_MIME_TYPES,
    useCloudinary: true,
    folder: 'car-images',
});
const carImageBulkUpload = upload_service_1.UploadService.createUploadMiddleware({
    fieldName: 'images',
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 20,
    allowedMimeTypes: AUTOMOTIVE_MIME_TYPES,
    useCloudinary: true,
    folder: 'car-images',
});
// ─── Public routes ────────────────────────────────────────────────────────────
router.get('/gallery', car_image_controller_1.CarImageController.getPublicGallery);
router.get('/gallery/car/:carId', car_image_controller_1.CarImageController.getCarGallery);
router.get('/gallery/car/:carId/category/:category', car_image_controller_1.CarImageController.getImagesByCategory);
router.get('/primary/:carId', car_image_controller_1.CarImageController.getPrimaryWithFallback);
// ─── Admin routes ─────────────────────────────────────────────────────────────
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictTo)('admin', 'super_admin'));
// List / single
adminRouter.get('/', validation_1.validatePaginationQuery, car_image_controller_1.CarImageController.getAllAdminCarImages);
adminRouter.get('/:id', validation_1.validateIdParam, car_image_controller_1.CarImageController.getAdminCarImageById);
// Create / update / delete
adminRouter.post('/', rate_limit_middleware_1.uploadRateLimiter, carImageUpload, car_image_controller_1.CarImageController.createCarImage);
adminRouter.put('/:id', validation_1.validateIdParam, carImageUpload, car_image_controller_1.CarImageController.updateCarImage);
adminRouter.delete('/:id', validation_1.validateIdParam, car_image_controller_1.CarImageController.deleteCarImage);
// Status / primary
adminRouter.patch('/restore/:id', validation_1.validateIdParam, car_image_controller_1.CarImageController.restoreCarImage);
adminRouter.patch('/:id/publish', validation_1.validateIdParam, car_image_controller_1.CarImageController.togglePublish);
adminRouter.patch('/:id/primary', validation_1.validateIdParam, car_image_controller_1.CarImageController.setPrimaryImage);
// Bulk operations
adminRouter.post('/bulk/status', car_image_controller_1.CarImageController.bulkUpdateStatus);
adminRouter.post('/bulk/category', car_image_controller_1.CarImageController.bulkAssignCategory);
adminRouter.post('/bulk/delete', car_image_controller_1.CarImageController.bulkDelete);
router.use('/admin', adminRouter);
exports.default = router;
