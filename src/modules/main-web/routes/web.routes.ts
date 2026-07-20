import { Router } from 'express';
import { electricCarsController } from '../controller/electric-cars.controller';
import { webCarsController } from '../controller/cars.controller';

const router = Router();

// ============================================================================
// MAIN WEB PUBLIC API ROUTES (Centralized in main-web/routes/web.routes.ts)
// ============================================================================

// Electric Cars Routes
router.get('/electric-cars', electricCarsController.getAllElectricCars);

// Upcoming Cars Routes
router.get('/upcoming-cars', webCarsController.getUpcomingCars);

// Car Discovery, Filter & Search Routes
router.get('/cars', webCarsController.getCars);
router.get('/cars/search', webCarsController.searchCars);
router.get('/cars/:idOrSlug', webCarsController.getCarDetail);

// Brand Authority Routes
router.get('/brands', webCarsController.getBrands);
router.get('/brands/:slug', webCarsController.getBrandDetail);

// Side-by-Side Comparison Routes
router.get('/compare', webCarsController.compareCars);

// Editorial & News/Blog Routes
router.get('/blogs', webCarsController.getBlogs);
router.get('/blogs/:idOrSlug', webCarsController.getBlogDetail);

export default router;
