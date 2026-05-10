import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { validatePaginationQuery, validateSlugParam, validateUuidIdParam } from '../../../shared/validation';
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
adminRouter.get('/:id', validateUuidIdParam, FuelTypeController.getAdminFuelTypeById);
adminRouter.post('/', FuelTypeController.createFuelType);
adminRouter.put('/:id', validateUuidIdParam, FuelTypeController.updateFuelType);
adminRouter.delete('/:id', validateUuidIdParam, FuelTypeController.deleteFuelType);
adminRouter.patch('/restore/:id', validateUuidIdParam, FuelTypeController.restoreFuelType);
adminRouter.patch('/:id/publish', validateUuidIdParam, FuelTypeController.togglePublish);

router.use('/admin', adminRouter);

// Legacy routes for backward compatibility
router.get('/', validatePaginationQuery, FuelTypeController.getAllPublicFuelTypes);
router.get('/:slug', validateSlugParam, FuelTypeController.getPublicFuelTypeBySlug);

export default router;
