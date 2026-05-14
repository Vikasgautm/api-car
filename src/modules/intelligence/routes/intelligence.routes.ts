import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { IntelligenceController } from '../controllers/intelligence.controller';

const router = Router();

// Admin-only — these change classification globally.
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictTo('admin', 'super_admin'));

adminRouter.get('/mileage-benchmarks', IntelligenceController.getBenchmarkMatrix);
adminRouter.put(
  '/mileage-benchmarks/:body_type_id/:fuel_category',
  IntelligenceController.upsertOverride
);
adminRouter.delete(
  '/mileage-benchmarks/:body_type_id/:fuel_category',
  IntelligenceController.deleteOverride
);
adminRouter.post('/reclassify', IntelligenceController.reclassifyAll);

router.use('/admin', adminRouter);

export default router;
