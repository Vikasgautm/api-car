import { Router } from 'express';
import { BodyTypeController } from '../controllers/bodyType.controller';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';

const router = Router();

router.get('/', BodyTypeController.getAllBodyTypes);
router.get('/:slug', BodyTypeController.getBodyTypeBySlug);
router.post('/', protect, restrictTo("admin", "superadmin"), BodyTypeController.createBodyType);
router.put('/:id', protect, restrictTo("admin", "superadmin"), BodyTypeController.updateBodyType);
router.delete('/:id', protect, restrictTo("admin", "superadmin"), BodyTypeController.deleteBodyType);
router.patch('/restore/:id', protect, restrictTo("admin", "superadmin"), BodyTypeController.restoreBodyType);

export default router;
