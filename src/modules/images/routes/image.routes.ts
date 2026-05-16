import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { uploadRateLimiter } from '../../../middlewares/rate-limit.middleware';
import { UploadService } from '../../../shared/services/upload.service';
import { validateIdParam, validatePaginationQuery } from '../../../shared/validation';
import { ImageController } from '../controllers/image.controller';

const router = Router();

// Single image upload (returns metadata only, no DB save)
const singleImageUpload = UploadService.createUploadMiddleware({
  fieldName: 'image',
  maxFileSize: 5 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  useCloudinary: true,
  folder: 'general',
});

router.post(
  '/upload',
  protect,
  uploadRateLimiter,
  restrictTo('admin', 'super_admin'),
  singleImageUpload,
  ImageController.uploadImage
);

// Single image upload with DB save (includes cleanup on failure)
router.post(
  '/upload/save',
  protect,
  uploadRateLimiter,
  restrictTo('admin', 'super_admin'),
  singleImageUpload,
  ImageController.uploadImageWithSave
);

// Multiple images upload (returns metadata only, no DB save)
const multipleImagesUpload = UploadService.createUploadMiddleware({
  fieldName: 'images',
  maxFileSize: 5 * 1024 * 1024,
  maxFiles: 10,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  useCloudinary: true,
  folder: 'general',
});

router.post(
  '/upload/multiple',
  protect,
  uploadRateLimiter,
  restrictTo('admin', 'super_admin'),
  multipleImagesUpload,
  ImageController.uploadMultipleImages
);

// Multiple images upload with DB save (includes cleanup on failure)
router.post(
  '/upload/multiple/save',
  protect,
  uploadRateLimiter,
  restrictTo('admin', 'super_admin'),
  multipleImagesUpload,
  ImageController.uploadMultipleImagesWithSave
);

// List images with pagination and filtering
router.get(
  '/',
  protect,
  restrictTo('admin', 'super_admin'),
  validatePaginationQuery,
  ImageController.listImages
);

// Get single image by ID
router.get(
  '/:id',
  protect,
  restrictTo('admin', 'super_admin'),
  validateIdParam,
  ImageController.getImage
);

// Update image metadata
router.patch(
  '/:id',
  protect,
  restrictTo('admin', 'super_admin'),
  validateIdParam,
  ImageController.updateImage
);

// Delete image (soft delete with Cloudinary cleanup)
router.delete(
  '/:id',
  protect,
  restrictTo('admin', 'super_admin'),
  validateIdParam,
  ImageController.deleteImage
);

export default router;
