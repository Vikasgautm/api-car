"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const audit_controller_1 = require("../controllers/audit.controller");
const router = (0, express_1.Router)();
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictToEditorOrAbove)());
adminRouter.get('/', audit_controller_1.AuditController.list);
adminRouter.get('/recent', audit_controller_1.AuditController.recent);
adminRouter.get('/stale', audit_controller_1.AuditController.stale);
adminRouter.post('/mark-reviewed/:entity_type/:entity_id', audit_controller_1.AuditController.markReviewed);
router.use('/admin', adminRouter);
exports.default = router;
//# sourceMappingURL=audit.routes.js.map