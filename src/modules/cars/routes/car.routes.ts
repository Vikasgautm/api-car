import { Router } from 'express';
import { CarController } from '../controllers/car.controller';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';

const router = Router();

router.get('/', CarController.getAllCars);
router.get('/:slug', CarController.getCarBySlug);
router.post('/', protect, restrictTo('admin'), CarController.createCar);

export default router;
