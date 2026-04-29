"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const validation_1 = require("../../../shared/validation");
const image_category_controller_1 = require("../controllers/image-category.controller");
const router = (0, express_1.Router)();
// Admin routes (must be before /:id to avoid route conflicts)
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictTo)('admin', 'super_admin'));
adminRouter.get('/', validation_1.validatePaginationQuery, image_category_controller_1.ImageCategoryController.getAllImageCategories);
adminRouter.post('/', image_category_controller_1.ImageCategoryController.createImageCategory);
adminRouter.put('/:id', validation_1.validateIdParam, image_category_controller_1.ImageCategoryController.updateImageCategory);
adminRouter.delete('/:id', validation_1.validateIdParam, image_category_controller_1.ImageCategoryController.deleteImageCategory);
adminRouter.post('/:id/restore', validation_1.validateIdParam, image_category_controller_1.ImageCategoryController.restoreImageCategory);
adminRouter.patch('/:id/active', validation_1.validateIdParam, image_category_controller_1.ImageCategoryController.toggleImageCategoryActive);
adminRouter.post('/reorder', image_category_controller_1.ImageCategoryController.reorderImageCategories);
router.use('/admin', adminRouter);
// Public routes
router.get('/', image_category_controller_1.ImageCategoryController.getAllImageCategories);
router.get('/slug/:slug', image_category_controller_1.ImageCategoryController.getImageCategoryBySlug);
router.get('/:id', validation_1.validateIdParam, image_category_controller_1.ImageCategoryController.getImageCategoryById);
exports.default = router;
//# sourceMappingURL=image-category.routes.js.map