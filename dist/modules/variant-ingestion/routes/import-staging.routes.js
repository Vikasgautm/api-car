"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ImportStagingController_1 = require("../controllers/ImportStagingController");
const router = (0, express_1.Router)();
// Sessions
router.get('/sessions', ImportStagingController_1.ImportStagingController.getSessions);
router.get('/sessions/:id', ImportStagingController_1.ImportStagingController.getSession);
// Staging list + individual
router.get('/', ImportStagingController_1.ImportStagingController.getStagingList);
router.get('/:id/diff', ImportStagingController_1.ImportStagingController.getDiff);
router.get('/:id', ImportStagingController_1.ImportStagingController.getStagingVariant);
// Import flows
router.post('/preview', ImportStagingController_1.ImportStagingController.previewStaging);
router.post('/stage', ImportStagingController_1.ImportStagingController.createSession);
router.post('/check-duplicates', ImportStagingController_1.ImportStagingController.checkDuplicates);
// Bulk actions (must come before /:id routes)
router.patch('/bulk-link', ImportStagingController_1.ImportStagingController.bulkLinkCar);
router.patch('/bulk-validate', ImportStagingController_1.ImportStagingController.bulkValidate);
router.patch('/bulk-review', ImportStagingController_1.ImportStagingController.bulkReview);
router.patch('/bulk-ready', ImportStagingController_1.ImportStagingController.bulkMarkReady);
router.post('/bulk-push', ImportStagingController_1.ImportStagingController.bulkPush);
// Single variant actions
router.patch('/:id/link-car', ImportStagingController_1.ImportStagingController.linkCar);
router.patch('/:id/reject', ImportStagingController_1.ImportStagingController.rejectVariant);
exports.default = router;
//# sourceMappingURL=import-staging.routes.js.map