import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { FAQController } from '../controllers/faq.controller';

const router = Router();

router.get('/', FAQController.getAllFAQs);
router.get('/group/:groupName', FAQController.getFAQsByGroup);
router.get('/featured', FAQController.getFeaturedFAQs);
router.get('/tags/:tag', FAQController.getFAQsByTag);
router.post('/', protect, restrictTo("admin", "superadmin"), FAQController.createFAQ);
router.put('/:id', protect, restrictTo("admin", "superadmin"), FAQController.updateFAQ);
router.delete('/:id', protect, restrictTo("admin", "superadmin"), FAQController.deleteFAQ);
router.patch('/restore/:id', protect, restrictTo("admin", "superadmin"), FAQController.restoreFAQ);
router.patch('/:id/increment-views', FAQController.incrementViewCount);
router.patch('/:id/toggle', protect, restrictTo("admin", "superadmin"), FAQController.togglePublish);

export default router;
