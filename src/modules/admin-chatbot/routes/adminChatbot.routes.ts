import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { AdminChatbotController } from '../controllers/adminChatbot.controller';

const router = Router();
const adminRouter = Router();

adminRouter.use(protect);
adminRouter.use(restrictTo('viewer', 'editor', 'admin', 'super_admin'));

adminRouter.post('/ask', AdminChatbotController.ask);
adminRouter.post('/action', AdminChatbotController.performAction);

router.use('/admin', adminRouter);

export default router;
