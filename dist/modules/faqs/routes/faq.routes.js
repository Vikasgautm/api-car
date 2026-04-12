"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const faq_controller_1 = require("../controllers/faq.controller");
const router = (0, express_1.Router)();
router.get('/', faq_controller_1.FAQController.getAllFAQs);
router.get('/group/:groupName', faq_controller_1.FAQController.getFAQsByGroup);
router.get('/featured', faq_controller_1.FAQController.getFeaturedFAQs);
router.get('/tags/:tag', faq_controller_1.FAQController.getFAQsByTag);
router.post('/', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), faq_controller_1.FAQController.createFAQ);
router.put('/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), faq_controller_1.FAQController.updateFAQ);
router.delete('/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), faq_controller_1.FAQController.deleteFAQ);
router.patch('/restore/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), faq_controller_1.FAQController.restoreFAQ);
router.patch('/:id/increment-views', faq_controller_1.FAQController.incrementViewCount);
router.patch('/:id/toggle', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), faq_controller_1.FAQController.togglePublish);
exports.default = router;
//# sourceMappingURL=faq.routes.js.map