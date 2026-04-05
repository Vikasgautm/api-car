import { Router } from 'express';
import { CarCompareController } from '../controllers/car-compare.controller';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import upload from '../../../utils/cloudinary';

const router = Router();

router.get('/', CarCompareController.getAllComparisons);
router.get('/:route', CarCompareController.getComparisonByRoute);
router.post('/', protect, restrictTo('admin', 'superadmin'), upload.fields([{ name: "images", maxCount: 10 }]), CarCompareController.createComparison);
router.put('/:id', protect, restrictTo('admin', 'superadmin'), upload.fields([{ name: "images", maxCount: 10 }]), CarCompareController.updateComparison);
router.delete('/:id', protect, restrictTo('admin', 'superadmin'), CarCompareController.deleteComparison);
router.patch('/restore/:id', protect, restrictTo('admin', 'superadmin'), CarCompareController.restoreComparison);

export default router;
