import { Router } from 'express';
import authRoutes from '../../modules/auth/routes/auth.routes';
import blogRoutes from '../../modules/blogs/routes/blog.routes';
import bodyTypeRoutes from '../../modules/bodyTypes/routes/bodyType.routes';
import brandRoutes from '../../modules/brands/routes/brand.routes';
import carCompareRoutes from '../../modules/carCompare/routes/car-compare.routes';
import carRoutes from '../../modules/cars/routes/car.routes';
import cityRoutes from '../../modules/cities/routes/city.routes';
import faqRoutes from '../../modules/faqs/routes/faq.routes';
import imageRoutes from '../../modules/images/routes/image.routes';
import settingsRoutes from '../../modules/settings/routes/settings.routes';
import userRoutes from '../../modules/users/routes/user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/cars', carRoutes);
router.use('/brands', brandRoutes);
router.use('/body-types', bodyTypeRoutes);
router.use('/blogs', blogRoutes);
router.use('/cities', cityRoutes);
router.use('/faqs', faqRoutes);
router.use('/images', imageRoutes);
router.use('/car-compare', carCompareRoutes);
router.use('/users', userRoutes);
router.use('/settings', settingsRoutes);

export default router;
