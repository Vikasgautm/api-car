"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const governance_controller_1 = require("../controllers/governance.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
router.use((0, auth_middleware_1.restrictTo)('admin', 'super_admin'));
// ─── USERS ───────────────────────────────────────────────────────────────────
router.get('/users', governance_controller_1.GovernanceController.getGovernanceUsers);
router.post('/users', governance_controller_1.GovernanceController.createGovernanceUser);
router.get('/users/:id', governance_controller_1.GovernanceController.getGovernanceUserById);
router.put('/users/:id', governance_controller_1.GovernanceController.updateGovernanceUser);
router.patch('/users/:id/suspend', governance_controller_1.GovernanceController.suspendUser);
router.patch('/users/:id/activate', governance_controller_1.GovernanceController.activateUser);
// ─── PERMISSIONS ─────────────────────────────────────────────────────────────
router.get('/users/:id/permissions', governance_controller_1.GovernanceController.getUserPermissions);
router.get('/permissions/check', governance_controller_1.GovernanceController.checkPermission);
// ─── ACTIVITY ────────────────────────────────────────────────────────────────
router.get('/users/:id/activity', governance_controller_1.GovernanceController.getUserActivity);
router.get('/users/:id/activity-summary', governance_controller_1.GovernanceController.getUserActivitySummary);
router.get('/activity', governance_controller_1.GovernanceController.getAllActivity);
router.get('/activity/summary', governance_controller_1.GovernanceController.getCrossUserSummary);
// ─── OWNERSHIP ───────────────────────────────────────────────────────────────
router.get('/ownership', governance_controller_1.GovernanceController.getOwnershipGrid);
router.get('/ownership/unassigned', governance_controller_1.GovernanceController.getUnassignedBrands);
router.get('/ownership/workload', governance_controller_1.GovernanceController.getWorkloadSummaries);
router.post('/ownership/assign', governance_controller_1.GovernanceController.assignBrand);
router.post('/ownership/unassign', governance_controller_1.GovernanceController.unassignBrand);
// ─── WORKFLOW ────────────────────────────────────────────────────────────────
router.get('/workflow', governance_controller_1.GovernanceController.getWorkflowQueue);
router.get('/workflow/stats', governance_controller_1.GovernanceController.getWorkflowStats);
router.post('/workflow/submit', governance_controller_1.GovernanceController.submitForReview);
router.patch('/workflow/:id/approve', governance_controller_1.GovernanceController.approveWorkflow);
router.patch('/workflow/:id/reject', governance_controller_1.GovernanceController.rejectWorkflow);
router.patch('/workflow/:id/publish', governance_controller_1.GovernanceController.publishWorkflow);
// ─── EDIT LOCKS ──────────────────────────────────────────────────────────────
router.get('/locks/check', governance_controller_1.GovernanceController.checkLock);
router.post('/locks/acquire', governance_controller_1.GovernanceController.acquireLock);
router.post('/locks/release', governance_controller_1.GovernanceController.releaseLock);
router.post('/locks/force-release', governance_controller_1.GovernanceController.forceReleaseLock);
exports.default = router;
//# sourceMappingURL=governance.routes.js.map