"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const validation_1 = require("../../../shared/validation");
const faq_controller_1 = require("../controllers/faq.controller");
const router = (0, express_1.Router)();
// Public routes
router.get('/public', faq_controller_1.FAQController.getAllPublicFAQs);
router.get('/public/:id', faq_controller_1.FAQController.getPublicFAQById);
router.get('/group/:groupName', faq_controller_1.FAQController.getFAQsByGroup);
router.get('/featured', faq_controller_1.FAQController.getFeaturedFAQs);
router.get('/tags/:tag', faq_controller_1.FAQController.getFAQsByTag);
router.patch('/:id/increment-views', faq_controller_1.FAQController.incrementViewCount);
// Admin routes
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictTo)('admin', 'super_admin'));
adminRouter.get('/', validation_1.validatePaginationQuery, faq_controller_1.FAQController.getAllAdminFAQs);
adminRouter.get('/:id', validation_1.validateIdParam, faq_controller_1.FAQController.getAdminFAQById);
adminRouter.delete('/:id', validation_1.validateIdParam, faq_controller_1.FAQController.deleteFAQ);
adminRouter.patch('/restore/:id', validation_1.validateIdParam, faq_controller_1.FAQController.restoreFAQ);
// Editor routes (create/update/publish toggle)
const editorRouter = (0, express_1.Router)();
editorRouter.use(auth_middleware_1.protect);
editorRouter.use((0, auth_middleware_1.restrictToEditorOrAbove)());
editorRouter.post('/', faq_controller_1.FAQController.createFAQ);
editorRouter.put('/:id', validation_1.validateIdParam, faq_controller_1.FAQController.updateFAQ);
editorRouter.patch('/:id/toggle', validation_1.validateIdParam, faq_controller_1.FAQController.togglePublish);
router.use('/admin', adminRouter);
router.use('/editor', editorRouter);
// Legacy routes for backward compatibility
router.get('/', validation_1.validatePaginationQuery, faq_controller_1.FAQController.getAllPublicFAQs);
exports.default = router;
//# sourceMappingURL=faq.routes.js.map