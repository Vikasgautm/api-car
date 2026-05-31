import { Router } from 'express';
import { ComparisonController } from '../controllers/comparison.controller';
import { protect, restrictTo, optionalAuth } from '../../../middlewares/auth.middleware';

const router = Router();

// Public specific routes (must come before generic /:id routes)
router.get('/popular', (req, res, next) => ComparisonController.getPopularComparisons(req as any, res, next));
router.get('/trending', (req, res, next) => ComparisonController.getTrendingComparisons(req as any, res, next));
router.get('/category/:category', (req, res, next) => ComparisonController.getComparisonsByCategory(req as any, res, next));
router.get('/slug/:slug', (req, res, next) => ComparisonController.getComparisonBySlug(req as any, res, next));

// Rival management specific routes (must come before generic /:id routes)
router.post(
  '/rivals/add',
  protect,
  restrictTo('admin', 'super_admin'),
  (req, res, next) => ComparisonController.addRival(req as any, res, next),
);

router.delete(
  '/rivals/:car_id/:rival_id',
  protect,
  restrictTo('admin', 'super_admin'),
  (req, res, next) => ComparisonController.removeRival(req as any, res, next),
);

router.get('/rivals/:car_id', (req, res, next) => ComparisonController.getRivals(req as any, res, next));

// Admin routes (require authentication and admin role)
router.post(
  '/',
  protect,
  restrictTo('admin', 'super_admin'),
  (req, res, next) => ComparisonController.createComparison(req as any, res, next),
);

router.get(
  '/',
  optionalAuth,
  (req, res, next) => ComparisonController.getComparisons(req as any, res, next),
);

// Generic routes with ID (must come last)
router.put(
  '/:id',
  protect,
  restrictTo('admin', 'super_admin'),
  (req, res, next) => ComparisonController.updateComparison(req as any, res, next),
);

router.patch(
  '/:id/restore',
  protect,
  restrictTo('admin', 'super_admin'),
  (req, res, next) => ComparisonController.restoreComparison(req as any, res, next),
);

router.delete(
  '/:id',
  protect,
  restrictTo('admin', 'super_admin'),
  (req, res, next) => ComparisonController.deleteComparison(req as any, res, next),
);

router.get('/:id', (req, res, next) => ComparisonController.getComparisonById(req as any, res, next));

export default router;
