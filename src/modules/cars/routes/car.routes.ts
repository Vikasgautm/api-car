import { Router } from 'express';
import { CarController } from '../controllers/car.controller';
import { CarVariantController } from '../controllers/car-variant.controller';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import upload from "../../../utils/cloudinary";

const router = Router();

// Car Routes
router.get("/", CarController.getAllCars);
router.get("/:slug", CarController.getCarBySlug);
router.post(
  "/",
  protect,
  restrictTo("admin", "superadmin"),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  CarController.createCar
);
router.put(
  "/:id",
  protect,
  restrictTo("admin", "superadmin"),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  CarController.updateCar
);
router.delete(
  "/:id",
  protect,
  restrictTo("admin", "superadmin"),
  CarController.deleteCar
);

router.patch(
  '/restore/:id',
  protect,
  restrictTo('admin', 'superadmin'),
  CarController.restoreCar
);

// Variant Routes
router.get("/variants/all", CarVariantController.getAllVariants);
router.get("/variants/:slug", CarVariantController.getVariantBySlug);
router.post(
  "/variants",
  protect,
  restrictTo("admin", "superadmin"),
  CarVariantController.createVariant
);
router.put(
  "/variants/:id",
  protect,
  restrictTo("admin", "superadmin"),
  CarVariantController.updateVariant
);
router.delete(
  "/variants/:id",
  protect,
  restrictTo("admin", "superadmin"),
  CarVariantController.deleteVariant
);
router.patch(
  "/variants/restore/:id",
  protect,
  restrictTo("admin", "superadmin"),
  CarVariantController.restoreVariant
);

export default router;
