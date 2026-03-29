import { Router } from 'express';
import { CarController } from '../controllers/car.controller';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import upload from "../../../utils/cloudinary";

const router = Router();

router.get('/', CarController.getAllCars);
router.get('/:slug', CarController.getCarBySlug);

router.post(
  '/', 
  protect, 
  restrictTo('admin', 'superadmin'), 
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  CarController.createCar
);

router.put(
  '/:id', 
  protect, 
  restrictTo('admin', 'superadmin'), 
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  CarController.updateCar
);

router.delete(
  '/:id', 
  protect, 
  restrictTo('admin', 'superadmin'), 
  CarController.deleteCar
);

export default router;
