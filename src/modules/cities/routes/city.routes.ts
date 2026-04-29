import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { validateIdParam, validatePaginationQuery, validateSlugParam } from '../../../shared/validation';
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
adminRouter.get('/:id', validateIdParam, CityController.getAdminCityById);
adminRouter.post('/', CityController.createCity);
adminRouter.put('/:id', validateIdParam, CityController.updateCity);
adminRouter.delete('/:id', validateIdParam, CityController.deleteCity);

router.use('/admin', adminRouter);

// Legacy routes for backward compatibility
router.get('/', validatePaginationQuery, CityController.getAllPublicCities);
router.get('/:slug', validateSlugParam, CityController.getPublicCityBySlug);

export default router;
