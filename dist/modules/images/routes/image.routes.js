"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const rate_limit_middleware_1 = require("../../../middlewares/rate-limit.middleware");
const upload_service_1 = require("../../../shared/services/upload.service");
const validation_1 = require("../../../shared/validation");
const image_controller_1 = require("../controllers/image.controller");
const router = (0, express_1.Router)();
// Single image upload (returns metadata only, no DB save)
const singleImageUpload = upload_service_1.UploadService.createUploadMiddleware({
    fieldName: 'image',
    maxFileSize: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    useCloudinary: true,
    folder: 'general',
});
router.post('/upload', auth_middleware_1.protect, rate_limit_middleware_1.uploadRateLimiter, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), singleImageUpload, image_controller_1.ImageController.uploadImage);
// Single image upload with DB save (includes cleanup on failure)
router.post('/upload/save', auth_middleware_1.protect, rate_limit_middleware_1.uploadRateLimiter, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), singleImageUpload, image_controller_1.ImageController.uploadImageWithSave);
// Multiple images upload (returns metadata only, no DB save)
const multipleImagesUpload = upload_service_1.UploadService.createUploadMiddleware({
    fieldName: 'images',
    maxFileSize: 5 * 1024 * 1024,
    maxFiles: 10,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    useCloudinary: true,
    folder: 'general',
});
router.post('/upload/multiple', auth_middleware_1.protect, rate_limit_middleware_1.uploadRateLimiter, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), multipleImagesUpload, image_controller_1.ImageController.uploadMultipleImages);
// Multiple images upload with DB save (includes cleanup on failure)
router.post('/upload/multiple/save', auth_middleware_1.protect, rate_limit_middleware_1.uploadRateLimiter, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), multipleImagesUpload, image_controller_1.ImageController.uploadMultipleImagesWithSave);
// List images with pagination and filtering
router.get('/', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), validation_1.validatePaginationQuery, image_controller_1.ImageController.listImages);
// Get single image by ID
router.get('/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), validation_1.validateIdParam, image_controller_1.ImageController.getImage);
// Update image metadata
router.patch('/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), validation_1.validateIdParam, image_controller_1.ImageController.updateImage);
// Delete image (soft delete with Cloudinary cleanup)
router.delete('/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), validation_1.validateIdParam, image_controller_1.ImageController.deleteImage);
exports.default = router;
//# sourceMappingURL=image.routes.js.map