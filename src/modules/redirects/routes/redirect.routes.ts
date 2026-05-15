import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { validatePaginationQuery, validateUuidIdParam } from '../../../shared/validation';
import { RedirectController } from '../controllers/redirect.controller';

const router = Router();

// Public: resolve a path through the redirect table (used by frontend).
router.get('/public/resolve', RedirectController.resolvePublic);

// Admin routes
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictTo('admin', 'super_admin'));

adminRouter.get('/', validatePaginationQuery, RedirectController.list);
adminRouter.get('/:id', validateUuidIdParam, RedirectController.getById);
adminRouter.post('/', RedirectController.create);
adminRouter.put('/:id', validateUuidIdParam, RedirectController.update);
adminRouter.delete('/:id', validateUuidIdParam, RedirectController.remove);
adminRouter.patch('/restore/:id', validateUuidIdParam, RedirectController.restore);

router.use('/admin', adminRouter);

export default router;
