import { Router } from 'express';
import { protect, restrictTo, restrictToEditorOrAbove } from '../../../middlewares/auth.middleware';
import { validateIdParam, validatePaginationQuery } from '../../../shared/validation';
import { FAQController } from '../controllers/faq.controller';

const router = Router();

// Public routes
router.get('/public', FAQController.getAllPublicFAQs);
router.get('/public/:id', FAQController.getPublicFAQById);
router.get('/group/:groupName', FAQController.getFAQsByGroup);
router.get('/featured', FAQController.getFeaturedFAQs);
router.get('/tags/:tag', FAQController.getFAQsByTag);
router.patch('/:id/increment-views', FAQController.incrementViewCount);

// Admin routes
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictTo('admin', 'super_admin'));

adminRouter.get('/', validatePaginationQuery, FAQController.getAllAdminFAQs);
adminRouter.get('/:id', validateIdParam, FAQController.getAdminFAQById);
adminRouter.delete('/:id', validateIdParam, FAQController.deleteFAQ);
adminRouter.patch('/restore/:id', validateIdParam, FAQController.restoreFAQ);

// Editor routes (create/update/publish toggle)
const editorRouter = Router();
editorRouter.use(protect);
editorRouter.use(restrictToEditorOrAbove());

editorRouter.post('/', FAQController.createFAQ);
editorRouter.put('/:id', validateIdParam, FAQController.updateFAQ);
editorRouter.patch('/:id/toggle', validateIdParam, FAQController.togglePublish);

router.use('/admin', adminRouter);
router.use('/editor', editorRouter);

// Legacy routes for backward compatibility
router.get('/', validatePaginationQuery, FAQController.getAllPublicFAQs);

export default router;
