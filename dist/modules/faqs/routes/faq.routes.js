"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const faq_controller_1 = require("../controllers/faq.controller");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', faq_controller_1.FAQController.getAllFAQs);
router.post('/', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin'), faq_controller_1.FAQController.createFAQ);
exports.default = router;
//# sourceMappingURL=faq.routes.js.map