"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const validation_1 = require("../../../shared/validation");
const image_subcategory_controller_1 = require("../controllers/image-subcategory.controller");
const router = (0, express_1.Router)();
// Admin routes (must be before /:id to avoid route conflicts)
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictTo)('admin', 'super_admin'));
adminRouter.get('/', validation_1.validatePaginationQuery, image_subcategory_controller_1.ImageSubCategoryController.getAllImageSubCategories);
adminRouter.post('/', image_subcategory_controller_1.ImageSubCategoryController.createImageSubCategory);
adminRouter.put('/:id', validation_1.validateIdParam, image_subcategory_controller_1.ImageSubCategoryController.updateImageSubCategory);
adminRouter.delete('/:id', validation_1.validateIdParam, image_subcategory_controller_1.ImageSubCategoryController.deleteImageSubCategory);
adminRouter.post('/:id/restore', validation_1.validateIdParam, image_subcategory_controller_1.ImageSubCategoryController.restoreImageSubCategory);
adminRouter.patch('/:id/active', validation_1.validateIdParam, image_subcategory_controller_1.ImageSubCategoryController.toggleImageSubCategoryActive);
adminRouter.post('/reorder', image_subcategory_controller_1.ImageSubCategoryController.reorderImageSubCategories);
router.use('/admin', adminRouter);
// Public routes
router.get('/', image_subcategory_controller_1.ImageSubCategoryController.getAllImageSubCategories);
router.get('/slug/:slug', image_subcategory_controller_1.ImageSubCategoryController.getImageSubCategoryBySlug);
router.get('/:id', validation_1.validateIdParam, image_subcategory_controller_1.ImageSubCategoryController.getImageSubCategoryById);
exports.default = router;
