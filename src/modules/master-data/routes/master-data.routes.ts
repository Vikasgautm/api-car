import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { MasterDataController } from '../controllers/master-data.controller';

const router = Router();

// All master-data routes require auth + admin
router.use(protect);
router.use(restrictTo('admin', 'super_admin'));

router.get('/categories', MasterDataController.getCategories);
router.get('/all', MasterDataController.getAllOptions);
router.get('/options/:categoryKey', MasterDataController.getOptions);
router.post('/options/:categoryKey', MasterDataController.createOption);
router.put('/options/:categoryKey/:optionId', MasterDataController.updateOption);
router.delete('/options/:categoryKey/:optionId', MasterDataController.deleteOption);
router.patch('/options/:categoryKey/:optionId/toggle', MasterDataController.toggleActive);
router.patch('/options/:categoryKey/reorder', MasterDataController.reorderOptions);
router.post('/seed', MasterDataController.seedDefaults);

// Unknown value review queue
router.get('/unknown-values', MasterDataController.getUnknownValues);
router.patch('/unknown-values/:unknownId/resolve', MasterDataController.resolveUnknownValue);
router.patch('/unknown-values/:unknownId/dismiss', MasterDataController.dismissUnknownValue);
router.post('/unknown-values/:unknownId/promote', MasterDataController.promoteUnknownToMaster);

export default router;
