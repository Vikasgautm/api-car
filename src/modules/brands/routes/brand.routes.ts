import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { UploadService } from '../../../shared/services/upload.service';
import { validatePaginationQuery, validateSlugParam, validateUuidIdParam } from '../../../shared/validation';
import { BrandController } from '../controllers/brand.controller';

const router = Router();

// Public routes
router.get('/public', validatePaginationQuery, BrandController.getAllPublicBrands);
router.get('/public/:slug', validateSlugParam, BrandController.getPublicBrandBySlug);

// Admin routes
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictTo('admin', 'super_admin'));

adminRouter.get('/', validatePaginationQuery, BrandController.getAllAdminBrands);
adminRouter.get('/:id', validateUuidIdParam, BrandController.getAdminBrandById);

const logoUpload = UploadService.createUploadMiddleware({
  fieldName: 'logo',
  maxFileSize: 2 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  useCloudinary: true,
  folder: 'brands',
});

adminRouter.post('/', logoUpload, BrandController.createBrand);
adminRouter.put('/:id', validateUuidIdParam, logoUpload, BrandController.updateBrand);
adminRouter.delete('/:id', validateUuidIdParam, BrandController.deleteBrand);
adminRouter.patch('/restore/:id', validateUuidIdParam, BrandController.restoreBrand);
adminRouter.patch('/:id/publish', validateUuidIdParam, BrandController.togglePublish);

router.use('/admin', adminRouter);

// Legacy routes for backward compatibility
router.get('/', validatePaginationQuery, BrandController.getAllPublicBrands);
router.get('/:slug', validateSlugParam, BrandController.getPublicBrandBySlug);

export default router;
