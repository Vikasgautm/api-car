import { Router } from 'express';
import authRoutes from '../../modules/auth/routes/auth.routes';
import blogRoutes from '../../modules/blogs/routes/blog.routes';
import bodyTypeRoutes from '../../modules/bodyTypes/routes/bodyType.routes';
import brandRoutes from '../../modules/brands/routes/brand.routes';
import carRoutes from '../../modules/cars/routes/car.routes';
import variantRoutes from '../../modules/cars/routes/variant.routes';
import cityRoutes from '../../modules/cities/routes/city.routes';
import faqRoutes from '../../modules/faqs/routes/faq.routes';
import fuelTypeRoutes from '../../modules/fuelTypes/routes/fuel-type.routes';
import carImageRoutes from '../../modules/images/routes/car-image.routes';
import imageCategoryRoutes from '../../modules/images/routes/image-category.routes';
import imageSubcategoryRoutes from '../../modules/images/routes/image-subcategory.routes';
import imageRoutes from '../../modules/images/routes/image.routes';
import importRoutes from '../../modules/imports/routes/import.routes';
import settingsRoutes from '../../modules/settings/routes/settings.routes';
import userRoutes from '../../modules/users/routes/user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/cars', carRoutes);
router.use('/variants', variantRoutes);
router.use('/brands', brandRoutes);
router.use('/body-types', bodyTypeRoutes);
router.use('/fuel-types', fuelTypeRoutes);
router.use('/blogs', blogRoutes);
router.use('/cities', cityRoutes);
router.use('/faqs', faqRoutes);
router.use('/images', imageRoutes);
router.use('/car-images', carImageRoutes);
router.use('/image-categories', imageCategoryRoutes);
router.use('/image-subcategories', imageSubcategoryRoutes);
router.use('/imports', importRoutes);
router.use('/users', userRoutes);
router.use('/settings', settingsRoutes);

export default router;
