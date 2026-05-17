import { Router } from 'express';
import { jwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { adminGuard } from '../../../modules/auth/guards/roles.guard';
import { ImportController } from '../controllers/import.controller';
import { AnalyticsController } from '../controllers/analytics.controller';
import { carPreviewSchema, carSaveSchema, variantPreviewSchema, variantSaveSchema } from '../validation/import.validation';
import { validateBody } from '../../../middlewares/validate.middleware';

const router = Router();

// All routes require authentication and admin role
router.use(jwtAuthGuard);
router.use(adminGuard);

// Car import routes (source auto-detected from URL domain)
router.post('/car/preview',
  validateBody(carPreviewSchema),
  ImportController.previewCarImport
);

router.post('/car/save',
  validateBody(carSaveSchema),
  ImportController.saveCarImport
);

// Variant import routes (source auto-detected from URL domain)
router.post('/variants/preview',
  validateBody(variantPreviewSchema),
  ImportController.previewVariantImport
);

router.post('/variants/save',
  validateBody(variantSaveSchema),
  ImportController.saveVariantImport
);

// Legacy cardekho aliases (kept for backwards compatibility with existing admin-car calls)
router.post('/cardekho/car/preview', validateBody(carPreviewSchema), ImportController.previewCarImport);
router.post('/cardekho/car/save', validateBody(carSaveSchema), ImportController.saveCarImport);
router.post('/cardekho/variants/preview', validateBody(variantPreviewSchema), ImportController.previewVariantImport);
router.post('/cardekho/variants/save', validateBody(variantSaveSchema), ImportController.saveVariantImport);

// Import logs
router.get('/logs',
  ImportController.getImportLogs
);

// Reprocess routes — re-run variants through the current SPEC_LABEL_MAP
// (useful when the map improves and you want old imports to benefit from new mappings)
router.post('/reprocess/variant/:variant_id',
  ImportController.reprocessVariant
);

router.post('/reprocess/car/:car_id',
  ImportController.reprocessCar
);

router.post('/reprocess/all',
  ImportController.reprocessAll
);

// Analytics routes — unmatched key frequency analysis
router.get('/analytics/unmatched-keys',
  AnalyticsController.getUnmatchedKeyFrequency
);

router.get('/analytics/unmatched-keys/by-source',
  AnalyticsController.getFrequencyBySource
);

router.get('/analytics/unmatched-keys/by-type',
  AnalyticsController.getFrequencyByImportType
);

// Multi-source consolidation routes
router.get('/analytics/consolidate/variant/:variant_id',
  AnalyticsController.consolidateVariantFromSources
);

router.get('/analytics/source-history/variant/:variant_id',
  AnalyticsController.getVariantSourceHistory
);

// Import confidence scoring routes
router.get('/analytics/confidence/import/:import_id',
  AnalyticsController.getImportConfidenceScore
);

router.get('/analytics/confidence/variant/:variant_id',
  AnalyticsController.getVariantConfidenceScores
);

router.get('/analytics/confidence/car/:car_id',
  AnalyticsController.getCarConfidenceScores
);

router.get('/analytics/quality-report',
  AnalyticsController.getBatchQualityReport
);

// Enum standardization routes
router.get('/analytics/standardization-report',
  AnalyticsController.getStandardizationReport
);

export default router;
