"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const lifecycle_governance_controller_1 = require("../controllers/lifecycle-governance.controller");
const router = (0, express_1.Router)();
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictToEditorOrAbove)());
// Any editor/admin/super_admin can create a request or list requests
adminRouter.get('/', lifecycle_governance_controller_1.LifecycleGovernanceController.listRequests);
adminRouter.post('/', lifecycle_governance_controller_1.LifecycleGovernanceController.createRequest);
adminRouter.post('/:id/cancel', lifecycle_governance_controller_1.LifecycleGovernanceController.cancelRequest);
// Super-admin only: approve, reject, verify OTP
adminRouter.post('/:id/approve', (0, auth_middleware_1.restrictTo)('super_admin'), lifecycle_governance_controller_1.LifecycleGovernanceController.approveRequest);
adminRouter.post('/:id/verify-otp', (0, auth_middleware_1.restrictTo)('super_admin'), lifecycle_governance_controller_1.LifecycleGovernanceController.verifyOTP);
adminRouter.post('/:id/reject', (0, auth_middleware_1.restrictTo)('super_admin'), lifecycle_governance_controller_1.LifecycleGovernanceController.rejectRequest);
// Get pending request for a specific car
adminRouter.get('/cars/:car_id/pending', lifecycle_governance_controller_1.LifecycleGovernanceController.getPendingForCar);
router.use('/admin', adminRouter);
exports.default = router;
