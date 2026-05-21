import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { uploadRateLimiter } from '../../../middlewares/rate-limit.middleware';
import { UploadService } from '../../../shared/services/upload.service';
import { validateIdParam, validatePaginationQuery } from '../../../shared/validation';
import { CarImageController } from '../controllers/car-image.controller';

const router = Router();

// ─── Allowed MIME types (avif, webp, png, jpeg — no gif/bmp/tiff/heic/svg) ───

const AUTOMOTIVE_MIME_TYPES = [
  'image/avif',
  'image/webp',
  'image/png',
  'image/jpeg',
];

const carImageUpload = UploadService.createUploadMiddleware({
  fieldName: 'image',
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  allowedMimeTypes: AUTOMOTIVE_MIME_TYPES,
  useCloudinary: true,
  folder: 'car-images',
});

const carImageBulkUpload = UploadService.createUploadMiddleware({
  fieldName: 'images',
  maxFileSize: 10 * 1024 * 1024,
  maxFiles: 20,
  allowedMimeTypes: AUTOMOTIVE_MIME_TYPES,
  useCloudinary: true,
  folder: 'car-images',
});

// ─── Public routes ────────────────────────────────────────────────────────────

router.get('/gallery', CarImageController.getPublicGallery);
router.get('/gallery/car/:carId', CarImageController.getCarGallery);
router.get('/gallery/car/:carId/category/:category', CarImageController.getImagesByCategory);
router.get('/primary/:carId', CarImageController.getPrimaryWithFallback);

// ─── Admin routes ─────────────────────────────────────────────────────────────

const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictTo('admin', 'super_admin'));

// List / single
adminRouter.get('/', validatePaginationQuery, CarImageController.getAllAdminCarImages);
adminRouter.get('/:id', validateIdParam, CarImageController.getAdminCarImageById);

// Create / update / delete
adminRouter.post('/', uploadRateLimiter, carImageUpload, CarImageController.createCarImage);
adminRouter.put('/:id', validateIdParam, carImageUpload, CarImageController.updateCarImage);
adminRouter.delete('/:id', validateIdParam, CarImageController.deleteCarImage);

// Status / primary
adminRouter.patch('/restore/:id', validateIdParam, CarImageController.restoreCarImage);
adminRouter.patch('/:id/publish', validateIdParam, CarImageController.togglePublish);
adminRouter.patch('/:id/primary', validateIdParam, CarImageController.setPrimaryImage);

// Bulk operations
adminRouter.post('/bulk/status', CarImageController.bulkUpdateStatus);
adminRouter.post('/bulk/category', CarImageController.bulkAssignCategory);
adminRouter.post('/bulk/delete', CarImageController.bulkDelete);

router.use('/admin', adminRouter);

export default router;
