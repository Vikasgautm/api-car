import { Router } from 'express';
import { CarCompareController } from '../controllers/car-compare.controller';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';

const router = Router();

router.get('/', CarCompareController.getAllComparisons);
router.get('/:route', CarCompareController.getComparisonByRoute);
router.post('/', protect, restrictTo('admin'), CarCompareController.createComparison);

export default router;
