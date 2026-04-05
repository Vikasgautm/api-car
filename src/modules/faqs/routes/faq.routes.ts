import { Router } from 'express';
import { FAQController } from '../controllers/faq.controller';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';

const router = Router();

router.get('/', FAQController.getAllFAQs);
router.post('/', protect, restrictTo("admin", "superadmin"), FAQController.createFAQ);
router.put('/:id', protect, restrictTo("admin", "superadmin"), FAQController.updateFAQ);
router.delete('/:id', protect, restrictTo("admin", "superadmin"), FAQController.deleteFAQ);
router.patch('/restore/:id', protect, restrictTo("admin", "superadmin"), FAQController.restoreFAQ);

export default router;
