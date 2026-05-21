import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { ContentHealthController } from '../controllers/content-health.controller';

const router = Router();
const adminRouter = Router();

adminRouter.use(protect);
adminRouter.use(restrictTo('admin', 'super_admin'));

adminRouter.get('/summary', ContentHealthController.getSummary);
adminRouter.get('/issues', ContentHealthController.getIssues);
adminRouter.get('/issues/:category', ContentHealthController.getIssuesByCategory);
adminRouter.get('/entity/:type/:id', ContentHealthController.getEntityIssues);

router.use('/admin', adminRouter);

export default router;
