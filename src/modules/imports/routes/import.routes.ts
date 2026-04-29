import { Router } from 'express';
import { jwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { adminGuard } from '../../../modules/auth/guards/roles.guard';
import { ImportController } from '../controllers/import.controller';
import { carPreviewSchema, carSaveSchema, variantPreviewSchema, variantSaveSchema } from '../validation/import.validation';
import { validateBody } from '../../../middlewares/validate.middleware';

const router = Router();

// All routes require authentication and admin role
router.use(jwtAuthGuard);
router.use(adminGuard);

// Car import routes
router.post('/cardekho/car/preview',
  validateBody(carPreviewSchema),
  ImportController.previewCarImport
);

router.post('/cardekho/car/save',
  validateBody(carSaveSchema),
  ImportController.saveCarImport
);

// Variant import routes
router.post('/cardekho/variants/preview',
  validateBody(variantPreviewSchema),
  ImportController.previewVariantImport
);

router.post('/cardekho/variants/save',
  validateBody(variantSaveSchema),
  ImportController.saveVariantImport
);

// Import logs
router.get('/logs', 
  ImportController.getImportLogs
);

export default router;
