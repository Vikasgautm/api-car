import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { UploadService } from '../../../shared/services/upload.service';
import { createCarSchema, updateCarSchema, validatePaginationQuery, validateSlugParam, validateUuidIdParam } from '../../../shared/validation';
import { CarController } from '../controllers/car.controller';
import { validateBody } from '../../../middlewares/validate.middleware';

const router = Router();

// Public routes
router.get('/public', validatePaginationQuery, CarController.getAllPublicCars);
router.get('/public/:slug', validateSlugParam, CarController.getPublicCarBySlug);

// Admin routes
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictTo('admin', 'super_admin'));

adminRouter.get('/', validatePaginationQuery, CarController.getAllAdminCars);
adminRouter.post('/recompute-aggregates', restrictTo('super_admin'), CarController.recomputeAggregatesAll);
adminRouter.post('/:id/recompute-aggregates', validateUuidIdParam, CarController.recomputeAggregatesForCar);
adminRouter.post('/:id/refine-ai-flags', validateUuidIdParam, CarController.refineAiFlagsForCar);
adminRouter.get('/:id/dependencies', validateUuidIdParam, CarController.getCarDependencies);
adminRouter.get('/:id', validateUuidIdParam, CarController.getAdminCarById);

const thumbnailUpload = UploadService.createUploadMiddleware({
  fieldName: 'thumbnail',
  maxFileSize: 2 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  useCloudinary: true,
  folder: 'cars',
});

adminRouter.post('/', validateBody(createCarSchema), thumbnailUpload, CarController.createCar);
adminRouter.put('/:id', validateUuidIdParam, validateBody(updateCarSchema), thumbnailUpload, CarController.updateCar);
// Direct hard-delete is now reserved for super_admin. Day-to-day removals go
// through the OTP-gated deletion workflow (`POST /deletion-requests/admin`).
adminRouter.delete('/:id', validateUuidIdParam, restrictTo('super_admin'), CarController.deleteCar);
adminRouter.patch('/restore/:id', validateUuidIdParam, CarController.restoreCar);
adminRouter.patch('/:id/publish', validateUuidIdParam, CarController.togglePublish);
adminRouter.patch('/:id/mark-launched', validateUuidIdParam, CarController.markLaunched);
adminRouter.patch('/:id/mark-upcoming', validateUuidIdParam, CarController.markUpcoming);
adminRouter.post('/:id/promote-to-current', validateUuidIdParam, CarController.promoteToCurrent);

router.use('/admin', adminRouter);

// Legacy routes for backward compatibility
router.get('/', validatePaginationQuery, CarController.getAllPublicCars);
router.get('/:slug', validateSlugParam, CarController.getPublicCarBySlug);

export default router;
