import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { FuelTypesIntelligenceController } from '../controllers/fuel-types-intelligence.controller';

const router = Router();
const adminRouter = Router();

adminRouter.use(protect);
adminRouter.use(restrictTo('admin', 'super_admin'));

adminRouter.get('/summary', FuelTypesIntelligenceController.getSummary);
adminRouter.get('/brands', FuelTypesIntelligenceController.getBrands);
adminRouter.get('/body-types', FuelTypesIntelligenceController.getBodyTypes);
adminRouter.get('/budget', FuelTypesIntelligenceController.getBudget);
adminRouter.get('/brand-body-budget', FuelTypesIntelligenceController.getBrandBodyBudget);
adminRouter.get('/seating', FuelTypesIntelligenceController.getSeating);
adminRouter.get('/lifecycle', FuelTypesIntelligenceController.getLifecycle);
adminRouter.get('/health', FuelTypesIntelligenceController.getHealth);
adminRouter.get('/multi-fuel', FuelTypesIntelligenceController.getMultiFuel);

router.use('/admin', adminRouter);

export default router;
