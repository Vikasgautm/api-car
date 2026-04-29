import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { UploadService } from '../../../shared/services/upload.service';
import { validatePaginationQuery, validateSlugParam, validateUuidIdParam } from '../../../shared/validation';
import { CarController } from '../controllers/car.controller';

const router = Router();

// Public routes
router.get('/public', validatePaginationQuery, CarController.getAllPublicCars);
router.get('/public/:slug', validateSlugParam, CarController.getPublicCarBySlug);

// Admin routes
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictTo('admin', 'super_admin'));

adminRouter.get('/', validatePaginationQuery, CarController.getAllAdminCars);
adminRouter.get('/:id', validateUuidIdParam, CarController.getAdminCarById);

const thumbnailUpload = UploadService.createUploadMiddleware({
  fieldName: 'thumbnail',
  maxFileSize: 2 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  useCloudinary: true,
  folder: 'cars',
});

adminRouter.post('/', thumbnailUpload, CarController.createCar);
adminRouter.put('/:id', validateUuidIdParam, thumbnailUpload, CarController.updateCar);
adminRouter.delete('/:id', validateUuidIdParam, CarController.deleteCar);
adminRouter.patch('/restore/:id', validateUuidIdParam, CarController.restoreCar);
adminRouter.patch('/:id/publish', validateUuidIdParam, CarController.togglePublish);
adminRouter.patch('/:id/mark-launched', validateUuidIdParam, CarController.markLaunched);
adminRouter.patch('/:id/mark-upcoming', validateUuidIdParam, CarController.markUpcoming);

router.use('/admin', adminRouter);

// Legacy routes for backward compatibility
router.get('/', validatePaginationQuery, CarController.getAllPublicCars);
router.get('/:slug', validateSlugParam, CarController.getPublicCarBySlug);

export default router;
