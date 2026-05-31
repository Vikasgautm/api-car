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

// Operations Center (unified /audit page)
adminRouter.get('/activity', AuditController.activity);
adminRouter.get('/imports', AuditController.imports);
adminRouter.get('/imports/:import_id', AuditController.importDetail);
adminRouter.get('/alerts', AuditController.alerts);
adminRouter.get('/entity/search', AuditController.entitySearch);
adminRouter.get('/entity/:entity_type/:entity_id/history', AuditController.entityHistory);

router.use('/admin', adminRouter);

export default router;
