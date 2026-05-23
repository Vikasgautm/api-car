import { Router } from 'express';
import { protect, restrictTo, restrictToEditorOrAbove } from '../../../middlewares/auth.middleware';
import { validateIdParam, validatePaginationQuery } from '../../../shared/validation';
import { FAQController } from '../controllers/faq.controller';

const router = Router();

// ---- Public routes ----
router.get('/public', FAQController.getAllPublicFAQs);
router.get('/public/:id', FAQController.getPublicFAQById);
router.get('/group/:groupName', FAQController.getFAQsByGroup);
router.get('/featured', FAQController.getFeaturedFAQs);
router.get('/tags/:tag', FAQController.getFAQsByTag);
router.patch('/:id/increment-views', FAQController.incrementViewCount);
router.patch('/:id/increment-clicks', FAQController.incrementClickCount);

// Contextual FAQ orchestration (public-facing, powers all pages)
router.get('/orchestrate', FAQController.getContextualFAQs);

// FAQ templates (public — frontend needs these for preview)
router.get('/templates', FAQController.getTemplates);
router.get('/templates/page/:page_type', FAQController.getTemplatesForPage);
router.get('/templates/entity/:entity_type', FAQController.getTemplatesForEntity);

// Legacy route for backward compatibility
router.get('/', validatePaginationQuery, FAQController.getAllPublicFAQs);

// ---- Admin routes ----
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictTo('admin', 'super_admin'));

adminRouter.get('/', validatePaginationQuery, FAQController.getAllAdminFAQs);
adminRouter.get('/:id', validateIdParam, FAQController.getAdminFAQById);
adminRouter.delete('/:id', validateIdParam, FAQController.deleteFAQ);
adminRouter.patch('/restore/:id', validateIdParam, FAQController.restoreFAQ);

// Duplicate report
adminRouter.get('/reports/duplicates', FAQController.getDuplicatesReport);

// Bulk operations
adminRouter.post('/bulk/publish', FAQController.bulkPublish);
adminRouter.post('/bulk/archive', FAQController.bulkArchive);
adminRouter.post('/bulk/entity-attach', FAQController.bulkEntityAttach);
adminRouter.post('/bulk/visibility', FAQController.bulkVisibilityUpdate);
adminRouter.post('/bulk/schema', FAQController.bulkSchemaEnable);
adminRouter.post('/bulk/intent', FAQController.bulkIntentUpdate);
adminRouter.post('/bulk/retag', FAQController.bulkRetag);

// Duplicate check
adminRouter.post('/check-duplicate', FAQController.checkDuplicate);

router.use('/admin', adminRouter);

// ---- Editor routes (create/update/publish toggle) ----
const editorRouter = Router();
editorRouter.use(protect);
editorRouter.use(restrictToEditorOrAbove());

editorRouter.post('/', FAQController.createFAQ);
editorRouter.put('/:id', validateIdParam, FAQController.updateFAQ);
editorRouter.patch('/:id/toggle', validateIdParam, FAQController.togglePublish);

router.use('/editor', editorRouter);

export default router;
