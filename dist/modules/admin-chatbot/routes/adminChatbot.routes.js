"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const adminChatbot_controller_1 = require("../controllers/adminChatbot.controller");
const router = (0, express_1.Router)();
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictTo)('viewer', 'editor', 'admin', 'super_admin'));
adminRouter.post('/ask', adminChatbot_controller_1.AdminChatbotController.ask);
adminRouter.post('/action', adminChatbot_controller_1.AdminChatbotController.performAction);
router.use('/admin', adminRouter);
exports.default = router;
//# sourceMappingURL=adminChatbot.routes.js.map