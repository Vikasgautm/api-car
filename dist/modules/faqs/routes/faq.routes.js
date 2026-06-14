"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const validation_1 = require("../../../shared/validation");
const faq_controller_1 = require("../controllers/faq.controller");
const router = (0, express_1.Router)();
// ---- Public routes ----
router.get('/public', faq_controller_1.FAQController.getAllPublicFAQs);
router.get('/public/:id', faq_controller_1.FAQController.getPublicFAQById);
router.get('/group/:groupName', faq_controller_1.FAQController.getFAQsByGroup);
router.get('/featured', faq_controller_1.FAQController.getFeaturedFAQs);
router.get('/tags/:tag', faq_controller_1.FAQController.getFAQsByTag);
router.patch('/:id/increment-views', faq_controller_1.FAQController.incrementViewCount);
router.patch('/:id/increment-clicks', faq_controller_1.FAQController.incrementClickCount);
// Contextual FAQ orchestration (public-facing, powers all pages)
router.get('/orchestrate', faq_controller_1.FAQController.getContextualFAQs);
// FAQ templates (public — frontend needs these for preview)
router.get('/templates', faq_controller_1.FAQController.getTemplates);
router.get('/templates/page/:page_type', faq_controller_1.FAQController.getTemplatesForPage);
router.get('/templates/entity/:entity_type', faq_controller_1.FAQController.getTemplatesForEntity);
// Legacy route for backward compatibility
router.get('/', validation_1.validatePaginationQuery, faq_controller_1.FAQController.getAllPublicFAQs);
// ---- Admin routes ----
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictTo)('admin', 'super_admin'));
adminRouter.get('/', validation_1.validatePaginationQuery, faq_controller_1.FAQController.getAllAdminFAQs);
adminRouter.get('/:id', validation_1.validateIdParam, faq_controller_1.FAQController.getAdminFAQById);
adminRouter.delete('/:id', validation_1.validateIdParam, faq_controller_1.FAQController.deleteFAQ);
adminRouter.patch('/restore/:id', validation_1.validateIdParam, faq_controller_1.FAQController.restoreFAQ);
// Duplicate report
adminRouter.get('/reports/duplicates', faq_controller_1.FAQController.getDuplicatesReport);
// Health scoring (recompute faq_health_score / freshness_score / needs_refresh)
adminRouter.post('/health/bulk', faq_controller_1.FAQController.runBulkHealthCheck);
adminRouter.post('/:id/health', validation_1.validateIdParam, faq_controller_1.FAQController.checkFaqHealth);
// Bulk operations
adminRouter.post('/bulk/publish', faq_controller_1.FAQController.bulkPublish);
adminRouter.post('/bulk/archive', faq_controller_1.FAQController.bulkArchive);
adminRouter.post('/bulk/entity-attach', faq_controller_1.FAQController.bulkEntityAttach);
adminRouter.post('/bulk/visibility', faq_controller_1.FAQController.bulkVisibilityUpdate);
adminRouter.post('/bulk/schema', faq_controller_1.FAQController.bulkSchemaEnable);
adminRouter.post('/bulk/intent', faq_controller_1.FAQController.bulkIntentUpdate);
adminRouter.post('/bulk/retag', faq_controller_1.FAQController.bulkRetag);
// Duplicate check
adminRouter.post('/check-duplicate', faq_controller_1.FAQController.checkDuplicate);
router.use('/admin', adminRouter);
// ---- Editor routes (create/update/publish toggle) ----
const editorRouter = (0, express_1.Router)();
editorRouter.use(auth_middleware_1.protect);
editorRouter.use((0, auth_middleware_1.restrictToEditorOrAbove)());
editorRouter.post('/', faq_controller_1.FAQController.createFAQ);
editorRouter.post('/ai-draft', faq_controller_1.FAQController.draftFAQ);
editorRouter.put('/:id', validation_1.validateIdParam, faq_controller_1.FAQController.updateFAQ);
editorRouter.patch('/:id/toggle', validation_1.validateIdParam, faq_controller_1.FAQController.togglePublish);
editorRouter.patch('/:id/reviewed', validation_1.validateIdParam, faq_controller_1.FAQController.markReviewed);
router.use('/editor', editorRouter);
exports.default = router;
//# sourceMappingURL=faq.routes.js.map