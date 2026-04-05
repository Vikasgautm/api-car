import { Router } from 'express';
import { CityController } from '../controllers/city.controller';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';

const router = Router();

router.get('/', CityController.getAllCities);
router.post('/', protect, restrictTo('admin', 'superadmin'), CityController.createCity);
router.put('/:id', protect, restrictTo('admin', 'superadmin'), CityController.updateCity);
router.delete('/:id', protect, restrictTo('admin', 'superadmin'), CityController.deleteCity);
router.patch('/restore/:id', protect, restrictTo('admin', 'superadmin'), CityController.restoreCity);

export default router;
