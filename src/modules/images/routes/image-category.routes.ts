import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { validateIdParam, validatePaginationQuery } from '../../../shared/validation';
import { ImageCategoryController } from '../controllers/image-category.controller';

const router = Router();

// Admin routes (must be before /:id to avoid route conflicts)
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictTo('admin', 'super_admin'));

adminRouter.get('/', validatePaginationQuery, ImageCategoryController.getAllImageCategories);
adminRouter.post('/', ImageCategoryController.createImageCategory);
adminRouter.put('/:id', validateIdParam, ImageCategoryController.updateImageCategory);
adminRouter.delete('/:id', validateIdParam, ImageCategoryController.deleteImageCategory);
adminRouter.post('/:id/restore', validateIdParam, ImageCategoryController.restoreImageCategory);
adminRouter.patch('/:id/active', validateIdParam, ImageCategoryController.toggleImageCategoryActive);
adminRouter.post('/reorder', ImageCategoryController.reorderImageCategories);

router.use('/admin', adminRouter);

// Public routes
router.get('/', ImageCategoryController.getAllImageCategories);
router.get('/slug/:slug', ImageCategoryController.getImageCategoryBySlug);
router.get('/:id', validateIdParam, ImageCategoryController.getImageCategoryById);

export default router;
