import { Router } from 'express';
import { FAQController } from '../controllers/faq.controller';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';

const router = Router();

router.get('/', FAQController.getAllFAQs);
router.post('/', protect, restrictTo('admin'), FAQController.createFAQ);

export default router;
