import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { GovernanceController } from '../controllers/governance.controller';

const router = Router();

router.use(protect);
router.use(restrictTo('admin', 'super_admin'));

// ─── USERS ───────────────────────────────────────────────────────────────────
router.get('/users', GovernanceController.getGovernanceUsers);
router.post('/users', GovernanceController.createGovernanceUser);
router.get('/users/:id', GovernanceController.getGovernanceUserById);
router.put('/users/:id', GovernanceController.updateGovernanceUser);
router.patch('/users/:id/suspend', GovernanceController.suspendUser);
router.patch('/users/:id/activate', GovernanceController.activateUser);

// ─── PERMISSIONS ─────────────────────────────────────────────────────────────
router.get('/users/:id/permissions', GovernanceController.getUserPermissions);
router.get('/permissions/check', GovernanceController.checkPermission);

// ─── ACTIVITY ────────────────────────────────────────────────────────────────
router.get('/users/:id/activity', GovernanceController.getUserActivity);
router.get('/users/:id/activity-summary', GovernanceController.getUserActivitySummary);
router.get('/activity', GovernanceController.getAllActivity);
router.get('/activity/summary', GovernanceController.getCrossUserSummary);

// ─── OWNERSHIP ───────────────────────────────────────────────────────────────
router.get('/ownership', GovernanceController.getOwnershipGrid);
router.get('/ownership/unassigned', GovernanceController.getUnassignedBrands);
router.get('/ownership/workload', GovernanceController.getWorkloadSummaries);
router.post('/ownership/assign', GovernanceController.assignBrand);
router.post('/ownership/unassign', GovernanceController.unassignBrand);

// ─── WORKFLOW ────────────────────────────────────────────────────────────────
router.get('/workflow', GovernanceController.getWorkflowQueue);
router.get('/workflow/stats', GovernanceController.getWorkflowStats);
router.post('/workflow/submit', GovernanceController.submitForReview);
router.patch('/workflow/:id/approve', GovernanceController.approveWorkflow);
router.patch('/workflow/:id/reject', GovernanceController.rejectWorkflow);
router.patch('/workflow/:id/publish', GovernanceController.publishWorkflow);

// ─── EDIT LOCKS ──────────────────────────────────────────────────────────────
router.get('/locks/check', GovernanceController.checkLock);
router.post('/locks/acquire', GovernanceController.acquireLock);
router.post('/locks/release', GovernanceController.releaseLock);
router.post('/locks/force-release', GovernanceController.forceReleaseLock);

export default router;
