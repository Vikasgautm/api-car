import { Router } from "express";
import { protect, restrictTo, restrictToEditorOrAbove } from "../../../middlewares/auth.middleware";
import { UploadService } from "../../../shared/services/upload.service";
import { validatePaginationQuery, validateSlugParam, validateUuidIdParam } from "../../../shared/validation";
import { BlogController } from "../controllers/blog.controller";

// Public relationship routes (no auth required for consumption by frontend car/brand pages)
const relatedRouter = Router();
relatedRouter.get('/car/:carId', BlogController.getRelatedByCar);
relatedRouter.get('/brand/:brandId', BlogController.getRelatedByBrand);
relatedRouter.get('/fuel/:fuelId', BlogController.getRelatedByFuel);
relatedRouter.get('/body-type/:bodyTypeId', BlogController.getRelatedByBodyType);
relatedRouter.get('/comparison/:comparisonId', BlogController.getRelatedByComparison);

const router = Router();

// Public routes
router.get('/public', validatePaginationQuery, BlogController.getAllPublicBlogs);
router.get('/public/:slug', validateSlugParam, BlogController.getPublicBlogBySlug);

// Public entity-relationship routes (used by car/brand/fuel pages)
router.use('/related', relatedRouter);

// Admin routes
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictTo('admin', 'super_admin'));

// Static routes first (before /:id to avoid param capture)
adminRouter.get('/', validatePaginationQuery, BlogController.getAllAdminBlogs);
adminRouter.get('/activity', BlogController.getActivity);
adminRouter.get('/stale-alerts', BlogController.getStaleAlerts);
adminRouter.get('/content-health-summary', BlogController.getContentHealthSummary);
adminRouter.get('/entity-impact', BlogController.getEntityImpactAlerts);
adminRouter.get('/search-entities', BlogController.searchEntities);
adminRouter.post('/health/bulk', BlogController.runBulkHealthCheck);
adminRouter.post('/freshness/bulk', BlogController.runBulkFreshnessCheck);
adminRouter.post('/suggest-links', BlogController.suggestLinks);
// ID-parameterised routes after all statics
adminRouter.get('/:id', validateUuidIdParam, BlogController.getAdminBlogById);
adminRouter.delete('/:id', validateUuidIdParam, BlogController.deleteBlog);
adminRouter.patch('/restore/:id', validateUuidIdParam, BlogController.restoreBlog);
adminRouter.get('/:id/connections', validateUuidIdParam, BlogController.getConnections);
adminRouter.put('/:id/connections', validateUuidIdParam, BlogController.updateConnections);
adminRouter.get('/:id/seo-health', validateUuidIdParam, BlogController.getSeoHealth);
adminRouter.post('/:id/freshness', validateUuidIdParam, BlogController.checkFreshness);
adminRouter.get('/:id/related', validateUuidIdParam, BlogController.getRelatedArticles);

// Editor routes (create/update/publish toggle)
const editorRouter = Router();
editorRouter.use(protect);
editorRouter.use(restrictToEditorOrAbove());

// Multi-field upload middleware for blog create/update (thumbnail, linkImage, images)
const blogUpload = UploadService.createUploadMiddleware({
  fieldName: 'thumbnail',
  maxFileSize: 5 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  useCloudinary: true,
  folder: 'blogs',
  fields: [
    { name: 'thumbnail', maxCount: 1 },
    { name: 'linkImage', maxCount: 1 },
    { name: 'images', maxCount: 10 },
  ],
});

// Single image upload endpoint for JoditEditor
const singleImageUpload = UploadService.createUploadMiddleware({
  fieldName: 'image',
  maxFileSize: 5 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  useCloudinary: true,
  folder: 'blogs/editor',
});

// Dedicated single-image upload endpoint for editor
editorRouter.post('/upload-image', singleImageUpload, BlogController.uploadImage);

editorRouter.post('/', blogUpload, BlogController.createBlog);
editorRouter.put('/:id', validateUuidIdParam, blogUpload, BlogController.updateBlog);
editorRouter.patch('/:id/toggle', validateUuidIdParam, BlogController.togglePublish);

router.use('/admin', adminRouter);
router.use('/editor', editorRouter);

// Legacy routes for backward compatibility
router.get('/', validatePaginationQuery, BlogController.getAllPublicBlogs);
router.get('/:slug', validateSlugParam, BlogController.getPublicBlogBySlug);

export default router;
