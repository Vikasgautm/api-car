import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { UploadService } from '../../../shared/services/upload.service';
import { validateIdParam, validatePaginationQuery } from '../../../shared/validation';
import { CarImageController } from '../controllers/car-image.controller';

const router = Router();

// Public routes
router.get('/gallery', CarImageController.getPublicGallery);
router.get('/gallery/car/:carId', CarImageController.getCarGallery);

// Admin routes
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictTo('admin', 'super_admin'));

adminRouter.get('/', validatePaginationQuery, CarImageController.getAllAdminCarImages);
adminRouter.get('/:id', validateIdParam, CarImageController.getAdminCarImageById);

const carImageUpload = UploadService.createUploadMiddleware({
  fieldName: 'image',
  maxFileSize: 10 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  useCloudinary: true,
  folder: 'car-images',
});

adminRouter.post('/', carImageUpload, CarImageController.createCarImage);
adminRouter.put('/:id', validateIdParam, carImageUpload, CarImageController.updateCarImage);
adminRouter.delete('/:id', validateIdParam, CarImageController.deleteCarImage);
adminRouter.patch('/restore/:id', validateIdParam, CarImageController.restoreCarImage);
adminRouter.patch('/:id/publish', validateIdParam, CarImageController.togglePublish);
adminRouter.patch('/:id/primary', validateIdParam, CarImageController.setPrimaryImage);

router.use('/admin', adminRouter);

export default router;
