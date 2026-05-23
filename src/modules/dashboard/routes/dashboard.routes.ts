import { Router } from 'express';
import { protect, restrictToEditorOrAbove } from '../../../middlewares/auth.middleware';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();
const adminRouter = Router();

adminRouter.use(protect);
adminRouter.use(restrictToEditorOrAbove());

adminRouter.get('/overview', DashboardController.getOverview);
adminRouter.get('/priorities', DashboardController.getPriorities);
adminRouter.get('/content-health', DashboardController.getContentHealth);
adminRouter.get('/recent-activity', DashboardController.getRecentActivity);
adminRouter.get('/seo-summary', DashboardController.getSeoSummary);
adminRouter.get('/import-health', DashboardController.getImportHealth);
adminRouter.get('/fuel-summary', DashboardController.getFuelSummary);
adminRouter.get('/comparison-summary', DashboardController.getComparisonSummary);
adminRouter.get('/global-search', DashboardController.globalSearch);

router.use('/admin', adminRouter);

export default router;
