import { Router } from 'express';
import { BrandController } from '../controllers/brand.controller';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import upload from '../../../utils/cloudinary';

const router = Router();

router.get('/', BrandController.getAllBrands);
router.get('/:slug', BrandController.getBrandBySlug);
router.post('/', protect, restrictTo("admin", "superadmin"), upload.fields([{ name: "images", maxCount: 1 }]), BrandController.createBrand);
router.put('/:id', protect, restrictTo("admin", "superadmin"), upload.fields([{ name: "images", maxCount: 1 }]), BrandController.updateBrand);
router.delete('/:id', protect, restrictTo("admin", "superadmin"), BrandController.deleteBrand);
router.patch('/restore/:id', protect, restrictTo("admin", "superadmin"), BrandController.restoreBrand);

export default router;
