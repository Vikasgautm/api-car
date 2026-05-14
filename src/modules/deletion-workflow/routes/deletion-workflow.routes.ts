import { Router } from 'express';
import { protect, restrictToEditorOrAbove } from '../../../middlewares/auth.middleware';
import { DeletionWorkflowController } from '../controllers/deletion-workflow.controller';

const router = Router();

const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictToEditorOrAbove());

adminRouter.get('/', DeletionWorkflowController.list);
adminRouter.post('/', DeletionWorkflowController.create);
adminRouter.post('/:id/verify', DeletionWorkflowController.verify);
adminRouter.post('/:id/cancel', DeletionWorkflowController.cancel);

router.use('/admin', adminRouter);

export default router;
