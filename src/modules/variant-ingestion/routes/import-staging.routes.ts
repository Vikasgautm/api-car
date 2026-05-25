import { Router } from 'express';
import { ImportStagingController } from '../controllers/ImportStagingController';

const router = Router();

// Sessions
router.get('/sessions', ImportStagingController.getSessions);
router.get('/sessions/:id', ImportStagingController.getSession);

// Staging list + individual
router.get('/', ImportStagingController.getStagingList);
router.get('/:id/diff', ImportStagingController.getDiff);
router.get('/:id', ImportStagingController.getStagingVariant);

// Import flows
router.post('/preview', ImportStagingController.previewStaging);
router.post('/stage', ImportStagingController.createSession);
router.post('/check-duplicates', ImportStagingController.checkDuplicates);

// Bulk actions (must come before /:id routes)
router.patch('/bulk-link', ImportStagingController.bulkLinkCar);
router.patch('/bulk-validate', ImportStagingController.bulkValidate);
router.patch('/bulk-review', ImportStagingController.bulkReview);
router.patch('/bulk-ready', ImportStagingController.bulkMarkReady);
router.post('/bulk-push', ImportStagingController.bulkPush);

// Single variant actions
router.patch('/:id/link-car', ImportStagingController.linkCar);
router.patch('/:id/reject', ImportStagingController.rejectVariant);

export default router;
