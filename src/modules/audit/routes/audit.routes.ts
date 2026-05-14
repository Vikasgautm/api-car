import { Router } from 'express';
import { protect, restrictToEditorOrAbove } from '../../../middlewares/auth.middleware';
import { AuditController } from '../controllers/audit.controller';

const router = Router();

const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictToEditorOrAbove());

adminRouter.get('/', AuditController.list);
adminRouter.get('/recent', AuditController.recent);
adminRouter.get('/stale', AuditController.stale);
adminRouter.post('/mark-reviewed/:entity_type/:entity_id', AuditController.markReviewed);

router.use('/admin', adminRouter);

export default router;
