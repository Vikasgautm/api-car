import { Router } from 'express';
import { protect, restrictToEditorOrAbove } from '../../../middlewares/auth.middleware';
import { validateSlugParam, validateUuidIdParam } from '../../../shared/validation';
import { SeoPresetController } from '../controllers/seo-preset.controller';

const router = Router();

// Public hydration: resolve preset + matching cars in one call.
router.get('/public/:slug', validateSlugParam, SeoPresetController.getPublicBySlug);

const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictToEditorOrAbove());

adminRouter.get('/', SeoPresetController.list);
adminRouter.get('/:id', validateUuidIdParam, SeoPresetController.getById);
adminRouter.post('/', SeoPresetController.create);
adminRouter.put('/:id', validateUuidIdParam, SeoPresetController.update);
adminRouter.delete('/:id', validateUuidIdParam, SeoPresetController.remove);

router.use('/admin', adminRouter);

export default router;
