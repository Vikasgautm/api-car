"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const content_health_controller_1 = require("../controllers/content-health.controller");
const router = (0, express_1.Router)();
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictTo)('admin', 'super_admin'));
adminRouter.get('/summary', content_health_controller_1.ContentHealthController.getSummary);
adminRouter.get('/issues', content_health_controller_1.ContentHealthController.getIssues);
adminRouter.get('/issues/:category', content_health_controller_1.ContentHealthController.getIssuesByCategory);
adminRouter.get('/entity/:type/:id', content_health_controller_1.ContentHealthController.getEntityIssues);
router.use('/admin', adminRouter);
exports.default = router;
//# sourceMappingURL=content-health.routes.js.map