import { Router } from 'express';
import { protect, restrictTo, restrictToEditorOrAbove } from '../../../middlewares/auth.middleware';
import { LifecycleGovernanceController } from '../controllers/lifecycle-governance.controller';

const router = Router();

const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictToEditorOrAbove());

// Any editor/admin/super_admin can create a request or list requests
adminRouter.get('/', LifecycleGovernanceController.listRequests);
adminRouter.post('/', LifecycleGovernanceController.createRequest);
adminRouter.post('/:id/cancel', LifecycleGovernanceController.cancelRequest);

// Super-admin only: approve, reject, verify OTP
adminRouter.post('/:id/approve', restrictTo('super_admin'), LifecycleGovernanceController.approveRequest);
adminRouter.post('/:id/verify-otp', restrictTo('super_admin'), LifecycleGovernanceController.verifyOTP);
adminRouter.post('/:id/reject', restrictTo('super_admin'), LifecycleGovernanceController.rejectRequest);

// Get pending request for a specific car
adminRouter.get('/cars/:car_id/pending', LifecycleGovernanceController.getPendingForCar);

router.use('/admin', adminRouter);

export default router;
