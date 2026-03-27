import { Router } from 'express';
import { BrandController } from '../controllers/brand.controller';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';

const router = Router();

router.get('/', BrandController.getAllBrands);
router.get('/:slug', BrandController.getBrandBySlug);
router.post('/', protect, restrictTo('admin'), BrandController.createBrand);

export default router;
