"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const faq_controller_1 = require("../controllers/faq.controller");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', faq_controller_1.FAQController.getAllFAQs);
router.post('/', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), faq_controller_1.FAQController.createFAQ);
router.put('/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), faq_controller_1.FAQController.updateFAQ);
router.delete('/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), faq_controller_1.FAQController.deleteFAQ);
router.patch('/restore/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), faq_controller_1.FAQController.restoreFAQ);
exports.default = router;
//# sourceMappingURL=faq.routes.js.map