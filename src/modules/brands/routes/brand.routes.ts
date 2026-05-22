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
adminRouter.post('/refresh-all-aggregates', BrandController.refreshAllAggregates);
adminRouter.get('/:id', validateUuidIdParam, BrandController.getAdminBrandById);

const logoUpload = UploadService.createUploadMiddleware({
  fieldName: 'logo',
  maxFileSize: 2 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  useCloudinary: true,
  folder: 'brands',
});

adminRouter.post('/', logoUpload, BrandController.createBrand);
// Static sub-paths must be registered BEFORE parameterised /:id to avoid shadowing
adminRouter.patch('/restore/:id', validateUuidIdParam, BrandController.restoreBrand);
// Multipart form update (logo file upload)
adminRouter.put('/:id', validateUuidIdParam, logoUpload, BrandController.updateBrand);
// JSON update (from edit page — no file upload)
adminRouter.patch('/:id', validateUuidIdParam, BrandController.updateBrandJson);
adminRouter.delete('/:id', validateUuidIdParam, BrandController.deleteBrand);
adminRouter.patch('/:id/publish', validateUuidIdParam, BrandController.togglePublish);
adminRouter.post('/:id/refresh-aggregates', validateUuidIdParam, BrandController.refreshAggregates);

router.use('/admin', adminRouter);

// Legacy routes for backward compatibility
router.get('/', validatePaginationQuery, BrandController.getAllPublicBrands);
router.get('/:slug', validateSlugParam, BrandController.getPublicBrandBySlug);

export default router;
