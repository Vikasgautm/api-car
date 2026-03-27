import { Router } from 'express';
import { CityController } from '../controllers/city.controller';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';

const router = Router();

router.get('/', CityController.getAllCities);
router.post('/', protect, restrictTo('admin'), CityController.createCity);

export default router;
