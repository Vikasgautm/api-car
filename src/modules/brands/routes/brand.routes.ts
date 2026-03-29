import { Router } from 'express';
import { BrandController } from '../controllers/brand.controller';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import upload from '../../../utils/cloudinary';

const router = Router();

router.get('/', BrandController.getAllBrands);
router.get('/:slug', BrandController.getBrandBySlug);
router.post('/', protect, restrictTo("admin", "superadmin"), upload.fields([{ name: "images", maxCount: 1 }]), BrandController.createBrand);

export default router;
