import { Router } from "express";
import { protect, restrictTo, restrictToEditorOrAbove } from "../../../middlewares/auth.middleware";
import { UploadService } from "../../../shared/services/upload.service";
import { validatePaginationQuery, validateSlugParam, validateUuidIdParam } from "../../../shared/validation";
import { BlogController } from "../controllers/blog.controller";

const router = Router();

// Public routes
router.get('/public', validatePaginationQuery, BlogController.getAllPublicBlogs);
router.get('/public/:slug', validateSlugParam, BlogController.getPublicBlogBySlug);

// Admin routes
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictTo('admin', 'super_admin'));

adminRouter.get('/', validatePaginationQuery, BlogController.getAllAdminBlogs);
adminRouter.get('/:id', validateUuidIdParam, BlogController.getAdminBlogById);
adminRouter.delete('/:id', validateUuidIdParam, BlogController.deleteBlog);
adminRouter.patch('/restore/:id', validateUuidIdParam, BlogController.restoreBlog);

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
