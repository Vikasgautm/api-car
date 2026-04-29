"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const upload_service_1 = require("../../../shared/services/upload.service");
const validation_1 = require("../../../shared/validation");
const blog_controller_1 = require("../controllers/blog.controller");
const router = (0, express_1.Router)();
// Public routes
router.get('/public', validation_1.validatePaginationQuery, blog_controller_1.BlogController.getAllPublicBlogs);
router.get('/public/:slug', validation_1.validateSlugParam, blog_controller_1.BlogController.getPublicBlogBySlug);
// Admin routes
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictTo)('admin', 'super_admin'));
adminRouter.get('/', validation_1.validatePaginationQuery, blog_controller_1.BlogController.getAllAdminBlogs);
adminRouter.get('/:id', validation_1.validateUuidIdParam, blog_controller_1.BlogController.getAdminBlogById);
adminRouter.delete('/:id', validation_1.validateUuidIdParam, blog_controller_1.BlogController.deleteBlog);
adminRouter.patch('/restore/:id', validation_1.validateUuidIdParam, blog_controller_1.BlogController.restoreBlog);
// Editor routes (create/update/publish toggle)
const editorRouter = (0, express_1.Router)();
editorRouter.use(auth_middleware_1.protect);
editorRouter.use((0, auth_middleware_1.restrictToEditorOrAbove)());
// Multi-field upload middleware for blog create/update (thumbnail, linkImage, images)
const blogUpload = upload_service_1.UploadService.createUploadMiddleware({
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
const singleImageUpload = upload_service_1.UploadService.createUploadMiddleware({
    fieldName: 'image',
    maxFileSize: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    useCloudinary: true,
    folder: 'blogs/editor',
});
// Dedicated single-image upload endpoint for editor
editorRouter.post('/upload-image', singleImageUpload, blog_controller_1.BlogController.uploadImage);
editorRouter.post('/', blogUpload, blog_controller_1.BlogController.createBlog);
editorRouter.put('/:id', validation_1.validateUuidIdParam, blogUpload, blog_controller_1.BlogController.updateBlog);
editorRouter.patch('/:id/toggle', validation_1.validateUuidIdParam, blog_controller_1.BlogController.togglePublish);
router.use('/admin', adminRouter);
router.use('/editor', editorRouter);
// Legacy routes for backward compatibility
router.get('/', validation_1.validatePaginationQuery, blog_controller_1.BlogController.getAllPublicBlogs);
router.get('/:slug', validation_1.validateSlugParam, blog_controller_1.BlogController.getPublicBlogBySlug);
exports.default = router;
//# sourceMappingURL=blog.routes.js.map