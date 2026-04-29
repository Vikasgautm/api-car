import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { validateIdParam, validatePaginationQuery, validateSlugParam } from '../../../shared/validation';
import { FuelTypeController } from '../controllers/fuel-type.controller';

const router = Router();

// Public routes
router.get('/public', validatePaginationQuery, FuelTypeController.getAllPublicFuelTypes);
router.get('/public/:slug', validateSlugParam, FuelTypeController.getPublicFuelTypeBySlug);

// Admin routes
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictTo('admin', 'super_admin'));

adminRouter.get('/', validatePaginationQuery, FuelTypeController.getAllAdminFuelTypes);
adminRouter.get('/:id', validateIdParam, FuelTypeController.getAdminFuelTypeById);
adminRouter.post('/', FuelTypeController.createFuelType);
adminRouter.put('/:id', validateIdParam, FuelTypeController.updateFuelType);
adminRouter.delete('/:id', validateIdParam, FuelTypeController.deleteFuelType);
adminRouter.patch('/restore/:id', validateIdParam, FuelTypeController.restoreFuelType);
adminRouter.patch('/:id/publish', validateIdParam, FuelTypeController.togglePublish);

router.use('/admin', adminRouter);

// Legacy routes for backward compatibility
router.get('/', validatePaginationQuery, FuelTypeController.getAllPublicFuelTypes);
router.get('/:slug', validateSlugParam, FuelTypeController.getPublicFuelTypeBySlug);

export default router;
