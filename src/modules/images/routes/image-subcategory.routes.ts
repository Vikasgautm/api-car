import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { validateIdParam, validatePaginationQuery } from '../../../shared/validation';
import { ImageSubCategoryController } from '../controllers/image-subcategory.controller';

const router = Router();

// Admin routes (must be before /:id to avoid route conflicts)
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictTo('admin', 'super_admin'));

adminRouter.get('/', validatePaginationQuery, ImageSubCategoryController.getAllImageSubCategories);
adminRouter.post('/', ImageSubCategoryController.createImageSubCategory);
adminRouter.put('/:id', validateIdParam, ImageSubCategoryController.updateImageSubCategory);
adminRouter.delete('/:id', validateIdParam, ImageSubCategoryController.deleteImageSubCategory);
adminRouter.post('/:id/restore', validateIdParam, ImageSubCategoryController.restoreImageSubCategory);
adminRouter.patch('/:id/active', validateIdParam, ImageSubCategoryController.toggleImageSubCategoryActive);
adminRouter.post('/reorder', ImageSubCategoryController.reorderImageSubCategories);

router.use('/admin', adminRouter);

// Public routes
router.get('/', ImageSubCategoryController.getAllImageSubCategories);
router.get('/slug/:slug', ImageSubCategoryController.getImageSubCategoryBySlug);
router.get('/:id', validateIdParam, ImageSubCategoryController.getImageSubCategoryById);

export default router;
