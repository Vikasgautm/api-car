import { Router } from 'express';
import { protect, restrictToEditorOrAbove } from '../../../middlewares/auth.middleware';
import { validatePaginationQuery, validateSlugParam, validateUuidIdParam } from '../../../shared/validation';
import { TagCategoryController } from '../controllers/tag-category.controller';
import { TagController } from '../controllers/tag.controller';

const router = Router();

// ----- Public routes -----
router.get('/categories/public', validatePaginationQuery, TagCategoryController.getAllPublic);
router.get('/categories/public/:slug', validateSlugParam, TagCategoryController.getPublicBySlug);
router.get('/tags/public', validatePaginationQuery, TagController.getAllPublic);
router.get('/tags/public/:slug', validateSlugParam, TagController.getPublicBySlug);

// ----- Admin routes -----
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictToEditorOrAbove());

// Tag categories
adminRouter.get('/categories', validatePaginationQuery, TagCategoryController.getAllAdmin);
adminRouter.get('/categories/:id', validateUuidIdParam, TagCategoryController.getAdminById);
adminRouter.post('/categories', TagCategoryController.create);
adminRouter.put('/categories/:id', validateUuidIdParam, TagCategoryController.update);
adminRouter.delete('/categories/:id', validateUuidIdParam, TagCategoryController.remove);
adminRouter.patch('/categories/restore/:id', validateUuidIdParam, TagCategoryController.restore);

// Tags
adminRouter.get('/tags', validatePaginationQuery, TagController.getAllAdmin);
adminRouter.get('/tags/:id', validateUuidIdParam, TagController.getAdminById);
adminRouter.post('/tags', TagController.create);
adminRouter.put('/tags/:id', validateUuidIdParam, TagController.update);
adminRouter.delete('/tags/:id', validateUuidIdParam, TagController.remove);
adminRouter.patch('/tags/restore/:id', validateUuidIdParam, TagController.restore);

router.use('/admin', adminRouter);

export default router;
