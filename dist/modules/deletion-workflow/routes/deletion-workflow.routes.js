"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const deletion_workflow_controller_1 = require("../controllers/deletion-workflow.controller");
const router = (0, express_1.Router)();
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictToEditorOrAbove)());
adminRouter.get('/', deletion_workflow_controller_1.DeletionWorkflowController.list);
adminRouter.post('/', deletion_workflow_controller_1.DeletionWorkflowController.create);
adminRouter.post('/:id/verify', deletion_workflow_controller_1.DeletionWorkflowController.verify);
adminRouter.post('/:id/cancel', deletion_workflow_controller_1.DeletionWorkflowController.cancel);
router.use('/admin', adminRouter);
exports.default = router;
//# sourceMappingURL=deletion-workflow.routes.js.map