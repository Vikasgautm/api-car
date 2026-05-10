import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { validatePaginationQuery, validateSlugParam, validateUuidIdParam } from '../../../shared/validation';
import { CityController } from '../controllers/city.controller';

const router = Router();

// Public routes
router.get('/public', validatePaginationQuery, CityController.getAllPublicCities);
router.get('/public/:slug', validateSlugParam, CityController.getPublicCityBySlug);

// Admin routes
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictTo('admin', 'super_admin'));

adminRouter.get('/', validatePaginationQuery, CityController.getAllAdminCities);
adminRouter.get('/:id', validateUuidIdParam, CityController.getAdminCityById);
adminRouter.post('/', CityController.createCity);
adminRouter.put('/:id', validateUuidIdParam, CityController.updateCity);
adminRouter.delete('/:id', validateUuidIdParam, CityController.deleteCity);
adminRouter.patch('/restore/:id', validateUuidIdParam, CityController.restoreCity);

router.use('/admin', adminRouter);

// Legacy routes for backward compatibility
router.get('/', validatePaginationQuery, CityController.getAllPublicCities);
router.get('/:slug', validateSlugParam, CityController.getPublicCityBySlug);

export default router;
